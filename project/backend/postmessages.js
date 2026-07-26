"use strict";
/*
 *  Overseas applications HTTP REST server v1   MongoDB (Mongoose) + Express
 *
 *  Post and get simple text messages. Each message has a text content, a list of tags
 *  and an associated timestamp.
 *  All the posted messages are stored in a MongoDB collection.
 *
 *  The application also provide user authentication through JWT. The provided
 *  APIs are fully stateless.
 *
 *
 *
 *  Endpoints          Attributes          Method        Description
 *
 *     /                  -                  GET         Returns the version and a list of available endpoints
 *     /messages        ?tags=               GET         Returns all the posted messages, optionally filtered by tags
 *                      ?skip=n
 *                      ?limit=m
 *     /messages          -                  POST        Post a new message
 *     /messages/:id      -                  DELETE      Delete a message by id
 *     /tags              -                  GET         Get a list of tags
 *
 *     /users             -                  GET         List all users (moderators and admin only)
 *     /users/:mail       -                  GET         Get user info by mail
 *     /users/:mail       -                  DELETE      Delete a user by mail (moderators and admin only)
 *     /users             -                  POST        Add a new normal user
 *     /users/moderators  -                  POST        Add a new moderator (admin only)
 *     /login             -                  POST        login an existing user, returning a JWT
 *
 *
 * ------------------------------------------------------------------------------------
 *  To install the required modules:
 *  $ npm install
 *
 *  To compile:
 *  $ npm run compile
 *
 *  To setup:
 *  1) Create a file ".env" to store the JWT secret:
 *     JWT_SECRET=<secret>
 *
 *    $ echo "JWT_SECRET=secret" > ".env"
 *
 *  If you want to use HTTPS:
 * -------------------------------------------------
 *  2) Generate HTTPS self-signed certificates
 *    $ cd keys
 *    $ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 36
 *    $ openssl rsa -in key.pem -out newkey.pem && mv newkey.pem key.pem
 *
 *  3) In postman go to settings and deselect HTTPS certificate check (self-signed
 *     certificate will not work otherwise)
 * -------------------------------------------------
 *
 *  To run:
 *  $ node postmesages.js
 *
 *  To manually inspect the database:
 *  > use postmessages
 *  > show collections
 *  > db.messages.find( {} )
 *
 *  to delete all the messages:
 *  > db.messages.deleteMany( {} )
 *
 */
exports.__esModule = true;
var result = require('dotenv').config(); // The dotenv module will load a file named ".env"
// file and load all the key-value pairs into
// process.env (environment variable)
if (result.error) {
    console.log("Unable to load \".env\" file. Please provide one to store the JWT secret key");
    process.exit(-1);
}
if (!process.env.JWT_SECRET) {
    console.log("\".env\" file loaded but JWT_SECRET=<secret> key-value pair was not found");
    process.exit(-1);
}
var http = require("http"); // HTTP module
var colors = require("colors");
colors.enabled = true;
var mongoose = require("mongoose");
var agreement = require("./Agreement");
var transcriptRecord = require("./TranscriptRecord");
var user = require("./User");
var express = require("express");
var multer = require("multer");
var passport = require("passport"); // authentication middleware for Express
var passportHTTP = require("passport-http"); // implements Basic and Digest authentication for HTTP (used for /login endpoint)
var jsonwebtoken = require("jsonwebtoken"); // JWT generation
var jwt = require('express-jwt').expressjwt; // JWT parsing middleware for express
var cors = require("cors"); // Enable CORS middleware
var socket_io_1 = require("socket.io"); // Socket.io websocket library
var ios = undefined;
//////////////////////////////////////////////////////////////////////////////
//      MIDDLEWARES
//////////////////////////////////////////////////////////////////////////////
// We create the JWT authentication middleware
// provided by the express-jwt library.  
// 
// How it works (from the official documentation):
// If the token is valid, req.auth will be set with the JSON object 
// decoded to be used by later middleware for authorization and access control.
//
var auth = jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"]
});
// Custom middlewares:
function ensureModeratorRole(req, res, next) {
    if (user.newUser(req.auth).hasModeratorRole())
        return next(); // invoke next middleware function
    console.log(req.auth);
    // if not a moderator, invoke the error handler
    return next({ statusCode: 403, error: true, errormessage: "Forbidden: user is not a moderator" });
}
function ensureAdminRole(req, res, next) {
    if (user.newUser(req.auth).hasAdminRole())
        return next(); // invoke next middleware function
    // if not an admin, invoke the error handler
    console.log(req.auth);
    return next({ statusCode: 403, error: true, errormessage: "Forbidden: user is not an admin" });
}
/**
 * Creating a new user or a new moderator is a very similar operation. The only difference is that
 * creating a moderator requires an admin role. Therefore, we create a middleware to handle
 * the creation of a new user, and design a different middleware chain to handle the two cases
 * (see the routing definition below)
 *
 * In Express.js, you can pass parameters to middleware functions by defining a function that takes additional
 * arguments for the parameters (isModerator in our case) and then returning the actual middleware function.
 * This pattern is often referred to as "middleware factories."
 */
function adduserMiddlewareFactory(isModerator) {
    return function (req, res, next) {
        req.body.roles = []; // this is to avoid users to create themselves as admins or moderators
        var newuser = user.newUser(req.body);
        if (!req.body.password) {
            return next({ statusCode: 404, error: true, errormessage: "Password field missing" });
        }
        newuser.setPassword(req.body.password);
        if (isModerator)
            newuser.setModerator();
        console.log("Creating new user ".concat(newuser.username, ", moderator: ").concat(newuser.hasModeratorRole()));
        newuser.save().then(function (data) {
            return res.status(200).json({ error: false, errormessage: "", id: data._id });
        })["catch"](function (reason) {
            if (reason.code === 11000)
                return next({ statusCode: 404, error: true, errormessage: "User already exists" });
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
        });
    };
}
// -------------- END OF MIDDLEWARES DEFINITION ----------------------
var app = express();
// By default, web browsers enforce a strict security rule that blocks a website on 
// one domain from fetching data from an API on a completely different domain. 
// A server sends CORS headers, in particularly Access-Control-Allow-Origin 
// to give the client browser to make HTTP requests from a different website
// the cors middleware inserts Acces-Control-Allow-Origin automatically
// to any given response
app.use(cors());
// Install the top-level middleware "json" that parses JSON
// strings from requests and exposes the resulting object
// into req.body
app.use(express.json());
// Install a custom top-level logging middleware on any
// endpoint
app.use(function (req, res, next) {
    console.log("------------------------------------------------".inverse);
    console.log("New request for: " + req.url);
    console.log("Method: " + req.method);
    console.log("Headers: ", req.headers);
    console.log("Body: ", req.body);
    next();
});
//////////////////////////////////////////////////////////////////////////////
//      API ROUTES
//////////////////////////////////////////////////////////////////////////////
/*
  LOGIN -> GET
  USERS -> GET, POST, DELETE, PUT
  APPLICATIONS -> GET, POST, DELETE, PUT
  LEARNING AGREEMENTS -> GET, POST, DELETE, PUT (APPROVED / MODIFIED sono campi della risorsa)
  TRANSCRIPTS OF RECORDS -> GET, POST, DELETE, PUT
  HOST INSTITUTIONS -> GET, POST, DELETE
*/
app.get("/api/v1", function (req, res) {
    res.status(200).json({ api_version: "1.0", endpoints: ["/applications", "/agreements", "/transcriptRecords", "/hosts", "/users", "/login"] }); // json method sends a JSON response (setting the correct Content-Type) to the client
});
//////////////
// Agreements
//////////////
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
app.post("/api/v1/agreements/:applicationid", auth, upload.single('agreement'), function (req, res, next) {
    console.log("Received: " + JSON.stringify(req.body));
    var recvagreements = req.body;
    recvagreements.filename = req.file.originalname;
    recvagreements.content = req.file.buffer;
    recvagreements.mimetype = req.file.mimetype;
    recvagreements.uploadDate = new Date();
    recvagreements.applicationid = req.params.applicationid;
    recvagreements.matrNumber = req.body.matrnumber;
    recvagreements.approved = false;
    recvagreements.modified = true;
    recvagreements.lecturerReason = '';
    if (agreement.isAgreement(recvagreements)) {
        agreement.getModel().create(recvagreements).then(function (data) {
            if (ios) {
                // Notify all socket.io clients
                console.log("socket.io send");
                ios.emit("broadcast", JSON.stringify(data));
            }
            return res.status(200).json({ error: false, errormessage: "", id: data._id });
        })["catch"](function (reason) {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Data is not a valid learning agreement" });
    }
});
app.get("/api/v1/agreements/:applicationid", auth, function (req, res, next) {
    // req.params.applicationid contains the :applicationid URL component
    agreement.getModel().find({ applicationid: req.params.applicationid }).then(function (q) {
        if (q.length > 0)
            return res.status(200).json({ q: q });
        else
            return res.status(404).json({ error: true, errormessage: "no learning agreement present" });
    })["catch"](function (reason) {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app["delete"]("/api/v1/agreements/:applicationid", auth, function (req, res, next) {
    console.log("Delete request for learning agreement with application id: " + req.params.applicationid);
    // req.params.applicationid contains the :applicationid URL component
    agreement.getModel().deleteMany({ applicationid: req.params.applicationid }).then(function (q) {
        if (q.deletedCount > 0)
            return res.status(200).json({ error: false, errormessage: "" });
        else
            return res.status(404).json({ error: true, errormessage: "Invalid application ID" });
    })["catch"](function (reason) {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.put("/api/v1/agreements/:agreementid", auth, upload.single('agreement'), function (req, res, next) {
    console.log("Update request for learning agreement with id: " + req.params.agreementid);
    if (req.file) {
        // req.params.applicationid contains the :applicationid URL component
        var recvagreements = req.body;
        recvagreements.filename = req.file.originalname;
        recvagreements.content = req.file.buffer;
        recvagreements.mimetype = req.file.mimetype;
        recvagreements.uploadDate = new Date();
        recvagreements.applicationid = req.body.applicationid;
        recvagreements.matrNumber = req.body.matrnumber;
        recvagreements.approved = req.body.approved;
        recvagreements.modified = true;
        recvagreements.lecturerReason = req.body.lecturerReason;
        if (agreement.isAgreement(recvagreements)) {
            agreement.getModel().updateOne({ _id: req.params.agreementid }, recvagreements).then(function (q) {
                if (q.modifiedCount > 0)
                    return res.status(200).json({ error: false, errormessage: "" });
                else
                    return next({ statusCode: 404, error: true, errormessage: "Data is not a valid learning agreement" });
            })["catch"](function (reason) {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
        else {
            return next({ statusCode: 404, error: true, errormessage: "Data is not a valid learning agreement" });
        }
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Learning agreement missing" });
    }
});
//////////////////////
// Transcript Records
//////////////////////
app.post("/api/v1/transcriptRecords", auth, function (req, res, next) {
    console.log("Received: " + JSON.stringify(req.body));
    var recvtranscriptRecords = req.body;
    recvtranscriptRecords.uploadDate = new Date();
    if (transcriptRecord.isTranscriptRecord(recvtranscriptRecords)) {
        transcriptRecord.getModel().create(recvtranscriptRecords).then(function (data) {
            if (ios) {
                // Notify all socket.io clients
                console.log("socket.io send");
                ios.emit("broadcast", JSON.stringify(data));
            }
            return res.status(200).json({ error: false, errormessage: "", id: data._id });
        })["catch"](function (reason) {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Data is not a valid transcript of records" });
    }
});
app.get("/api/v1/transcriptRecords/:applicationid", auth, function (req, res, next) {
    // req.params.applicationid contains the :applicationid URL component
    transcriptRecord.getModel().find({ applicationID: req.params.applicationid }).then(function (q) {
        if (q.length > 0)
            return res.status(200).json({ q: q });
        else
            return res.status(404).json({ error: true, errormessage: "no transcript of records present" });
    })["catch"](function (reason) {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app["delete"]("/api/v1/transcriptRecords/:applicationid", auth, function (req, res, next) {
    console.log("Delete request for transcript of records with application id: " + req.params.applicationid);
    // req.params.applicationid contains the :applicationid URL component
    transcriptRecord.getModel().deleteMany({ applicationID: req.params.applicationid }).then(function (q) {
        if (q.deletedCount > 0)
            return res.status(200).json({ error: false, errormessage: "" });
        else
            return res.status(404).json({ error: true, errormessage: "Invalid application ID" });
    })["catch"](function (reason) {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.put("/api/v1/transcriptRecords/:transcriptid", auth, function (req, res, next) {
    console.log("Update request for transcript of records with id: " + req.params.transcriptid);
    // req.params.applicationid contains the :applicationid URL component
    var recvtranscriptRecords = req.body;
    recvtranscriptRecords.uploadDate = new Date();
    if (transcriptRecord.isTranscriptRecord(recvtranscriptRecords)) {
        transcriptRecord.getModel().updateOne({ _id: req.params.transcriptid }, recvtranscriptRecords).then(function (q) {
            if (q.modifiedCount > 0)
                return res.status(200).json({ error: false, errormessage: "" });
            else
                return next({ statusCode: 404, error: true, errormessage: "Data is not a valid transcript of records" });
        })["catch"](function (reason) {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Data is not a valid transcript of records" });
    }
});
// Hosts
/*

app.route("/api/v1/messages").get( auth, (req,res,next) => {

    let filter = {};
    if( req.query.tags ) {
        filter = { tags: {$all: req.query.tags } };
    }
    console.log("Using filter: " + JSON.stringify(filter) );
    console.log(" Using query: " + JSON.stringify(req.query) );

    let skip = parseInt( req.query.skip as string || "0" ) || 0;
    let limit = parseInt( req.query.limit as string || "20" ) || 20;

    message.getModel().find( filter ).sort({timestamp:-1}).skip( skip ).limit( limit ).then( (documents) => {
      return res.status(200).json( documents );
    }).catch( (reason) => {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    })

}).post( auth, (req,res,next) => {

    console.log("Received: " + JSON.stringify(req.body) );

    let recvmessage = req.body;
    recvmessage.timestamp = new Date();
    recvmessage.authormail = req.auth.mail;

    if( message.isMessage( recvmessage ) ) {

      message.getModel().create( recvmessage ).then( ( data ) => {

        if( ios ) {
          // Notify all socket.io clients
          console.log("socket.io send");
          ios.emit( "broadcast", JSON.stringify(data) );
        }

        return res.status(200).json({ error: false, errormessage: "", id: data._id });

      }).catch((reason) => {
        return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
      })

    } else {
      return next({ statusCode:404, error: true, errormessage: "Data is not a valid Message" });
    }

});






app.delete( '/api/v1/messages/:messageid', auth, ensureModeratorRole, (req,res,next) => {

  console.log("Delete request for message id: "+req.params.messageid )
  
  // req.params.messageid contains the :messageid URL component

  message.getModel().deleteOne( {_id: req.params.messageid } ).then(
    ( q )=> {
      if( q.deletedCount > 0 )
        return res.status(200).json( {error:false, errormessage:""} );
      else
        return res.status(404).json( {error:true, errormessage:"Invalid message ID"} );
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});


app.get('/api/v1/users', auth, ensureModeratorRole, (req,res,next) => {

  user.getModel().find( {}, {digest:0, salt:0} ).then( (users) => {
    return res.status(200).json( users );
  }).catch( (reason) => {
    return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});


app.post('/api/v1/users', adduserMiddlewareFactory( false ) );
app.post('/api/v1/users/moderators', auth, ensureAdminRole, adduserMiddlewareFactory( true ) );


app.route('/api/v1/users/:mail').get(auth, ensureModeratorRole, (req,res,next) => {

  // req.params.mail contains the :mail URL component
  user.getModel().findOne( {mail: req.params.mail }, {digest: 0, salt:0 }).then( (user)=> {
    return res.status(200).json( user );
  }).catch( (reason) => {
    return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

}).delete( auth, ensureAdminRole, (req,res,next) => {

  // lookup the user to delete
  user.getModel().findOne( {mail: req.params.mail }, {digest: 0, salt:0 }).then( (user)=> {
    if( !user )
      return next({ statusCode:404, error: true, errormessage: "Invalid user" });

    if( user.hasAdminRole() )
      return next({ statusCode:404, error: true, errormessage: "Cannot delete an admin user user" });

    user.deleteOne().then( () => {
      return res.status(200).json( {error:false, errormessage:"" } );
    });

  }).catch( (reason) => {
    return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});
*/
// Configure HTTP basic authentication strategy 
// trough passport middleware.
// NOTE: Always use HTTPS with Basic Authentication
passport.use(new passportHTTP.BasicStrategy(function (username, password, done) {
    // "done" callback (verify callback) documentation:  http://www.passportjs.org/docs/configure/
    // Delegate function we provide to passport middleware
    // to verify user credentials 
    console.log("New login attempt from ".green + username);
    user.getModel().findOne({ mail: username }).then(function (user) {
        if (!user) {
            return done({ statusCode: 500, error: true, errormessage: "Invalid user" });
        }
        if (user.validatePassword(password)) {
            // user exists and password is valid!
            return done(null, user);
        }
        return done({ statusCode: 500, error: true, errormessage: "Invalid password" });
    })["catch"](function (err) {
        return done({ statusCode: 500, error: true, errormessage: err });
    });
}));
// Login endpoint uses passport middleware to check
// user credentials before generating a new JWT
app.get("/api/v1/login", passport.authenticate('basic', { session: false }), function (req, res, next) {
    if (!req.user)
        return res.status(500).json({ statusCode: 500, error: true, errormessage: "Login error" });
    // If we reach this point, the user is successfully authenticated and
    // has been injected into req.user
    // We now generate a JWT with the useful user data
    // and return it as response
    var tokendata = {
        username: req.user.username,
        roles: req.user.roles,
        mail: req.user.mail,
        id: req.user.id
    };
    console.log("Login granted. Generating token");
    var token_signed = jsonwebtoken.sign(tokendata, String(process.env.JWT_SECRET), { expiresIn: '1h' });
    // Note: You can manually check the JWT content at https://jwt.io
    return res.status(200).json({ error: false, errormessage: "", token: token_signed });
});
// Add a global error handling middleware
app.use((function (err, req, res, next) {
    console.log("Request error: ".red + JSON.stringify(err));
    res.status(err.statusCode || 500).json(err);
}));
// The very last middleware will report an error 404 
// (will be eventually reached if no error occurred and if
//  the requested endpoint is not matched by any route)
//
app.use(function (req, res, next) {
    res.status(404).json({ statusCode: 404, error: true, errormessage: "Invalid endpoint" });
});
//////////////////////////////////////////////////////////////////////////////
//      Application bootstrap
//////////////////////////////////////////////////////////////////////////////
// Connect to mongodb and launch the HTTP server trough Express
//
mongoose.connect('mongodb://mymongo:27017/postmessages')
    .then(function () {
    console.log("Connected to MongoDB");
    return user.getModel().findOne({ mail: "admin@cafoscari.it" });
}).then(function (doc) {
    if (!doc) {
        console.log("Creating admin user");
        var u = user.newUser({
            username: "admin",
            mail: "admin@cafoscari.it"
        });
        u.setAdmin();
        u.setModerator();
        u.setPassword("admin");
        return u.save();
    }
    else {
        console.log("Admin user already exists");
    }
})
    .then(function () {
    return message.getModel().countDocuments({});
}).then(function (count) {
    if (count == 0) {
        console.log("Adding some test into the database");
        var m1 = message
            .getModel()
            .create({
            tags: ["Tag1", "Tag2", "Tag3"],
            content: "Post 1",
            timestamp: new Date(),
            authormail: "admin@cafoscari.it"
        });
        var m2 = message
            .getModel()
            .create({
            tags: ["Tag1", "Tag5"],
            content: "Post 2",
            timestamp: new Date(),
            authormail: "admin@cafoscari.it"
        });
        var m3 = message
            .getModel()
            .create({
            tags: ["Tag6", "Tag10"],
            content: "Post 3",
            timestamp: new Date(),
            authormail: "admin@cafoscari.it"
        });
        return Promise.all([m1, m2, m3]);
    }
}).then(function () {
    var server = http.createServer(app);
    ios = new socket_io_1.Server(server, {
        cors: {
            origin: ["http://localhost:4200", "http://localhost:4201", "http://localhost:8080"] // See: https://socket.io/docs/v4/handling-cors/#configuration
        }
    });
    ios.on('connection', function (client) {
        console.log("Socket.io client connected".green);
    });
    server.listen(8080, function () { return console.log("HTTP Server started on port 8080".green); });
    // To start an HTTPS server we create an https.Server instance 
    // passing the express application middleware. Then, we start listening
    // on port 8443
    //
    /*
    https.createServer({
      key: fs.readFileSync('keys/key.pem'),
      cert: fs.readFileSync('keys/cert.pem')
    }, app).listen(8443);
    */
})["catch"](function (err) {
    console.log("Error Occurred during initialization".red);
    console.log(err);
});
