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
 *  $ node mobility_application.js
 * 
 *  To manually inspect the database:
 *  > use mobility_application
 *  > show collections
 *  > db.host.find( {} )
 *  
 *  to delete all the messages:
 *  > db.host.deleteMany( {} )
 * 
 */


const result = require('dotenv').config()     // The dotenv module will load a file named ".env"
                                              // file and load all the key-value pairs into
                                              // process.env (environment variable)
if (result.error) {
  console.log("Unable to load \".env\" file. Please provide one to store the JWT secret key");
  process.exit(-1);
}
if( !process.env.JWT_SECRET ) {
  console.log("\".env\" file loaded but JWT_SECRET=<secret> key-value pair was not found");
  process.exit(-1);
}

import fs = require('fs');
import http = require('http');                  // HTTP module
import https = require('https');                // HTTPS module
import colors = require('colors');
colors.enabled = true;


import mongoose = require('mongoose');
import {Application} from './Application';
import * as application from './Application';

import {Agreement} from './Agreement';
import * as agreement from './Agreement';

import {TranscriptRecord} from './TranscriptRecord';
import * as transcriptRecord from './TranscriptRecord';

import { User } from './User';
import * as user from './User';

import { Host } from './Host';
import * as host from './Host';

import express = require('express');

import multer = require('multer');

import passport = require('passport');           // authentication middleware for Express
import passportHTTP = require('passport-http');  // implements Basic and Digest authentication for HTTP (used for /login endpoint)

import jsonwebtoken = require('jsonwebtoken');  // JWT generation
const { expressjwt: jwt } = require('express-jwt');            // JWT parsing middleware for express

import cors = require('cors');                  // Enable CORS middleware
import { Server as SocketIOServer} from 'socket.io';               // Socket.io websocket library
import { nextTick } from 'process';

import { Buffer } from 'node:buffer';
import { open } from 'node:fs/promises';


// Let's add some custom type definition to the Express
// types. Remember that interfaces are open-ended, so we
// can easily add properties to existing object types
declare global {
  namespace Express {
      interface User {
        mail:string,
        username: string,
        roles: string[],
        id: string
      }

      interface Request {
        auth: {
          mail: string,
          username: string
        }
      }
    }
}


let ios:SocketIOServer|undefined = undefined;


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
let auth = jwt( {
                  secret: process.env.JWT_SECRET, 
                  algorithms: ["HS256"]
                } );


// Custom middlewares:

function ensureModeratorRole( req : express.Request, res:express.Response, next: express.NextFunction )
{
  if( user.newUser(req.auth).hasModeratorRole() )
    return next(); // invoke next middleware function

  console.log( req.auth )

  // if not a moderator, invoke the error handler
  return next({ statusCode:403, error: true, errormessage: "Forbidden: user is not a moderator"} );
}


function ensureAdminRole( req : express.Request, res:express.Response, next: express.NextFunction )
{
  if( user.newUser(req.auth).hasAdminRole() )
    return next(); // invoke next middleware function

  // if not an admin, invoke the error handler
  console.log( req.auth )
  return next({ statusCode:403, error: true, errormessage: "Forbidden: user is not an admin"} );
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
function adduserMiddlewareFactory( isModerator:boolean ) {
  return (req:express.Request, res:express.Response, next:express.NextFunction ) => {

    req.body.roles = []; // this is to avoid users to create themselves as admins or moderators
    let newuser:User = user.newUser( req.body );

    if( !req.body.password ) {
      return next({ statusCode:404, error: true, errormessage: "Password field missing"} );
    }
    newuser.setPassword( req.body.password );

    if( isModerator )
      newuser.setModerator();

    console.log(`Creating new user ${newuser.username}, moderator: ${newuser.hasModeratorRole()}`);

    newuser.save().then( (data) => {
      return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch( (reason) => {
      if( reason.code === 11000 )
        return next({statusCode:404, error:true, errormessage: "User already exists"} );
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason.errmsg });
    })

  }
}


// -------------- END OF MIDDLEWARES DEFINITION ----------------------


let app = express();


// By default, web browsers enforce a strict security rule that blocks a website on 
// one domain from fetching data from an API on a completely different domain. 
// A server sends CORS headers, in particularly Access-Control-Allow-Origin 
// to give the client browser to make HTTP requests from a different website

// the cors middleware inserts Acces-Control-Allow-Origin automatically
// to any given response

app.use( cors() );



// Install the top-level middleware "json" that parses JSON
// strings from requests and exposes the resulting object
// into req.body
app.use( express.json( ) );


// Install a custom top-level logging middleware on any
// endpoint
app.use( (req,res,next) => {
  console.log("------------------------------------------------".inverse);
  console.log("New request for: "+req.url );
  console.log("Method: "+req.method);
  console.log("Headers: ", req.headers);
  console.log("Body: ", req.body);
  next();
});



//////////////////////////////////////////////////////////////////////////////
//      API ROUTES
//////////////////////////////////////////////////////////////////////////////



/*
  LOGIN -> GET, POST
  USERS -> GET, POST, DELETE, PUT
  APPLICATIONS -> GET, POST, DELETE, PUT
  LEARNING AGREEMENTS -> GET, POST, DELETE, PUT (APPROVED / MODIFIED sono campi della risorsa)
  TRANSCRIPTS OF RECORDS -> GET, POST, DELETE, PUT
  HOST INSTITUTIONS -> GET, POST, DELETE, PUT
*/


app.get("/api/v1", (req,res) => {

    res.status(200).json( { api_version: "1.0", endpoints: [ "/applications","/agreements", "/transcriptRecords", "/hosts", "/users", "/login" ] } ); // json method sends a JSON response (setting the correct Content-Type) to the client

});



////////////////
// Applications
////////////////

/*
export interface Application {

    id: String,
    status: String,
    uploadDate: Date,
    academicYear: String,
    semester: String,
    matrNumber: String,
    name: String,
    surname: String,
    departement: String,
    sendingInst: String,
    sendingCountry: String,
    hostInst: String,
    hostCountry: String,
    courses: CourseEval[],
    referent: String,
    approved: Boolean,
    modified: Boolean,
    lecturerReason: String
}
*/


app.get("/api/v1/applications/:matrNumber/:applicationstatus", auth, (req,res,next) => {

  application.getModel().find( {matrNumber: req.params.matrNumber, status: req.params.applicationstatus} ).then( 
    ( q )=> {

      if( q.length > 0)
        return res.status(200).json( {q} );
      else 
        return res.status(404).json( {error:true, errormessage:"no application present"} );
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});


app.get("/api/v1/applications/", auth, (req,res,next) => {

    console.log(req.query);

    if(req.query.referent) {
      application.getModel().find( {referent: req.query.referent} ).then( 
        ( q )=> {

          if( q.length > 0)
            return res.status(200).json( {q} );
          else
            return res.status(404).json( {error:true, errormessage:"no application present"} );
      }).catch( (reason)=> {
          return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
      })
    } else if( req.query.matrNumber ) {
        application.getModel().find( {matrNumber: req.query.matrNumber} ).then( 
        ( q )=> {

          if( q.length > 0)
            return res.status(200).json( {q} );
          else
            return res.status(404).json( {error:true, errormessage:"no application present"} );
      }).catch( (reason)=> {
          return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
      })
    } else {
        return res.status(404).json( {error:true, errormessage:"no valid query parameters"} );
    }
});


app.post("/api/v1/applications/:matrNumber", auth, async(req,res,next) => {

  console.log("Received: " + JSON.stringify(req.body) );
  let recvapplications= req.body;
  recvapplications.status = 'Created';
  recvapplications.matrNumber = req.params.matrNumber;
  recvapplications.approved = false;
  recvapplications.modified = false;
  recvapplications.lecturerReason = 'No reason provided';
  recvapplications.uploadDate = new Date();

  if(application.isApplication(recvapplications) && !req.params.matrNumber.includes('matrNumber')) {
    const existingApp = await application.getModel().findOne({matrNumber: req.params.matrNumber});

    if(existingApp) {
      return next({ statusCode:409, error: true, errormessage: "Data is already present" });
    }

    const data = await application.getModel().create(recvapplications).then((data) => {

      if(ios) {
        // Notify all socket.io clients
        console.log("socket.io send");
        ios.emit( "broadcast", JSON.stringify(data) );
      }

      return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    })
  } else {
    return next({ statusCode:404, error: true, errormessage: "Data is not a valid application" });
  }

});


app.put("/api/v1/applications/:applicationid", auth, (req,res,next) => {

  console.log("Update request for application with id: "+req.params.applicationid)
  console.log(req.query);

  if(req.body && Object.keys(req.body).length > 0) {

      let recvapplications= req.body;
      recvapplications.uploadDate = new Date();
      recvapplications.modified = true;

      if(req.query.referent) {
        recvapplications.status = req.body.status;
        if(req.body.approved === 'true' || req.body.approved === 'True' || req.body.approved === true ) {
          recvapplications.approved = true;
        } else {
          recvapplications.approved = false;
        }
        recvapplications.lecturerReason = req.body.lecturerReason || 'No reason provided';
      } else {
        recvapplications.approved = false;
        recvapplications.lecturerReason = 'No reason provided';
      }  


      application.getModel().updateOne( {_id: req.params.applicationid}, recvapplications ).then( 
      ( q )=> {

        if( q.modifiedCount > 0 )
          return res.status(200).json( {error:false, errormessage:""} );
        else
          return next({ statusCode:404, error: true, errormessage: "Data is not a valid application"});
        
      }).catch( (reason)=> {
          return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
      })


  } else {
      return next({ statusCode:404, error: true, errormessage: "Application missing"});
  }

});


app.delete("/api/v1/applications/:matrNumber/:applicationstatus", auth, (req,res,next) => {

  console.log("Delete request for application of matriculation number: "+req.params.matrNumber )

  application.getModel().deleteOne( {matrNumber: req.params.matrNumber, status: req.params.applicationstatus} ).then( 
    ( q )=> {

      if( q.deletedCount > 0 )
        return res.status(200).json( {error:false, errormessage:""} );
      else 
        return res.status(404).json( {error:true, errormessage:"Invalid matriculation number or application status"} );
      
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  }) 

});



///////////////////////
// Learning Agreements
///////////////////////

// Multer used for handling pdf file
// The file is not stored on disk but in database as a Buffer

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/api/v1/agreements/:applicationid", auth, upload.single('agreement'), (req,res,next) => {

  console.log("Received mimetype: " + JSON.stringify(req.file.mimetype) );
  console.log("Received bytes: " + JSON.stringify(req.file.buffer.byteLength) );
  if(req.file && req.file.buffer.byteLength > 0 && req.file.mimetype === 'application/pdf') {
    console.log("Received: " + JSON.stringify(req.body) );
    //console.log("Received file: " + JSON.stringify(req.file) );
    
    let recvagreements= req.body;
    recvagreements.filename = req.file.originalname;
    recvagreements.content = req.file.buffer;
    recvagreements.mimetype = req.file.mimetype;
    recvagreements.uploadDate = new Date();
    recvagreements.applicationid = req.params.applicationid;
    recvagreements.matrNumber = req.body.matrNumber;
    recvagreements.approved = false;
    recvagreements.modified = true;
    recvagreements.lecturerReason = 'No reason provided';

    if(agreement.isAgreement(recvagreements)) {

      agreement.getModel().create(recvagreements).then((data) => {

        if(ios) {
          // Notify all socket.io clients
          console.log("socket.io send");
          ios.emit( "broadcast", JSON.stringify(data) );
        }

        return res.status(200).json({ error: false, errormessage: "", id: data._id });
      }).catch((reason) => {
        return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
      })
    } else {
      return next({ statusCode:404, error: true, errormessage: "Data is not a valid learning agreement" });
    }
  } else {
    return next({ statusCode:404, error: true, errormessage: "Learning agreement missing or not a PDF file"});
  }
});


app.get("/api/v1/agreements/", auth, (req,res,next) => {

  if(req.query.applicationid) {

    agreement.getModel().find( {applicationid: req.query.applicationid} ).then( 
    ( q )=> {

      if( q.length > 0)
        return res.status(200).json( {q} );
      else 
        return res.status(404).json( {error:true, errormessage:"Invalid application id"} );
    }).catch( (reason)=> {
        return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    })
  } else if (req.query.matrNumber) {

    agreement.getModel().find( {matrNumber: req.query.matrNumber} ).then( 
    ( q )=> {

      if( q.length > 0)
        return res.status(200).json( {q} );
      else 
        return res.status(404).json( {error:true, errormessage:"Invalid matriculation number"} );
    }).catch( (reason)=> {
        return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    })
  } else {
    return res.status(404).json( {error:true, errormessage:"no valid query parameters"} );
  }

});



app.delete("/api/v1/agreements/:applicationid", auth, (req,res,next) => {

  console.log("Delete request for learning agreement with application id: "+req.params.applicationid )

  agreement.getModel().deleteMany( {applicationid: req.params.applicationid } ).then( 
    ( q )=> {

      if( q.deletedCount > 0 )
        return res.status(200).json( {error:false, errormessage:""} );
      else 
        return res.status(404).json( {error:true, errormessage:"Invalid application id"} );
      
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  }) 

});



app.put("/api/v1/agreements/:agreementid", auth, upload.single('agreement'), (req,res,next) => {

  console.log("Update request for learning agreement with id: "+req.params.agreementid)
  console.log("Received mimetype: " + JSON.stringify(req.file.mimetype) );
  console.log("Received bytes: " + JSON.stringify(req.file.buffer.byteLength) );

  if(req.file.buffer.byteLength > 0 && req.file.mimetype === 'application/pdf') {

    console.log("Received: " + JSON.stringify(req.body) );

    let recvagreements= req.body;
    recvagreements.filename = req.file.originalname;
    recvagreements.content = req.file.buffer;
    recvagreements.mimetype = req.file.mimetype;
    recvagreements.uploadDate = new Date();
    recvagreements.applicationid = req.body.applicationid;
    recvagreements.matrNumber = req.body.matrNumber;
    if(req.body.approved === 'true' || req.body.approved === 'True' || req.body.approved === true ) {
      recvagreements.approved = true;
    } else {
      recvagreements.approved = false;
    }
    recvagreements.modified = true;
    recvagreements.lecturerReason = req.body.lecturerReason || 'No reason provided';
      
    if(agreement.isAgreement(recvagreements)) {
      agreement.getModel().updateOne( {_id: req.params.agreementid}, recvagreements ).then( 
      ( q )=> {

        if( q.modifiedCount > 0 )
          return res.status(200).json( {error:false, errormessage:""} );
        else
          return next({ statusCode:404, error: true, errormessage: "Data is not a valid learning agreement"});
        
      }).catch( (reason)=> {
          return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
      })

    } else {
      return next({ statusCode:404, error: true, errormessage: "Data is not a valid learning agreement" });
    }

  } else {
      return next({ statusCode:404, error: true, errormessage: "Learning agreement missing"});
  }
  

});





/////////////////////////
// Transcript of Records
/////////////////////////


app.post("/api/v1/transcriptRecords", auth, (req,res,next) => {

  console.log("Received: " + JSON.stringify(req.body) );
  let recvtranscriptRecords= req.body;
  recvtranscriptRecords.uploadDate = new Date();

  if(transcriptRecord.isTranscriptRecord(recvtranscriptRecords)) {

    transcriptRecord.getModel().create(recvtranscriptRecords).then((data) => {

      if(ios) {
        // Notify all socket.io clients
        console.log("socket.io send");
        ios.emit( "broadcast", JSON.stringify(data) );
      }

      return res.status(200).json({ error: false, errormessage: "", id: data._id });
    }).catch((reason) => {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    })
  } else {
    return next({ statusCode:404, error: true, errormessage: "Data is not a valid transcript of records" });
  }

});


app.get("/api/v1/transcriptRecords/:applicationid", auth, (req,res,next) => {

  // req.params.applicationid contains the :applicationid URL component

  transcriptRecord.getModel().find( {applicationid: req.params.applicationid } ).then( 
    ( q )=> {
      if( q.length > 0 )
        return res.status(200).json( {q} );
      else 
        return res.status(404).json( {error:true, errormessage:"no transcript of records present"} );
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});


app.delete("/api/v1/transcriptRecords/:applicationid", auth, (req,res,next) => {

  console.log("Delete request for transcript of records with application id: "+req.params.applicationid )

  // req.params.applicationid contains the :applicationid URL component

  transcriptRecord.getModel().deleteMany( {applicationid: req.params.applicationid } ).then( 
    ( q )=> {

      if( q.deletedCount > 0 )
        return res.status(200).json( {error:false, errormessage:""} );
      else 
        return res.status(404).json( {error:true, errormessage:"Invalid application ID"} );
      
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});



app.put("/api/v1/transcriptRecords/:transcriptid", auth, (req,res,next) => {

  console.log("Update request for transcript of records with id: "+req.params.transcriptid)

  // req.params.applicationid contains the :applicationid URL component
  let recvtranscriptRecords= req.body;
  recvtranscriptRecords.uploadDate = new Date();

  if(transcriptRecord.isTranscriptRecord(recvtranscriptRecords)) {

    transcriptRecord.getModel().updateOne( {_id: req.params.transcriptid}, recvtranscriptRecords ).then( 
    ( q )=> {

      if( q.modifiedCount > 0 )
        return res.status(200).json( {error:false, errormessage:""} );
      else
        return next({ statusCode:404, error: true, errormessage: "Data is not a valid transcript of records"});
      
    }).catch( (reason)=> {
        return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    })

  } else {
    return next({ statusCode:404, error: true, errormessage: "Data is not a valid transcript of records" });
  }

});




/////////////////////
// Host institutions
/////////////////////


app.get("/api/v1/hosts/", auth, (req,res,next) => {

  let skip = parseInt( req.query.skip as string || "0" ) || 0;
  let limit = parseInt( req.query.limit as string || "20" ) || 20;

  host.getModel().find().sort({timestamp:-1}).skip( skip ).limit( limit ).then( (documents) => {
    return res.status(200).json( documents );
  }).catch( (reason) => {
    return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});

app.post("/api/v1/hosts/", auth, ensureModeratorRole , (req,res,next) => {

 console.log("Received: " + JSON.stringify(req.body) );
 let recvhost= req.body;

  if(host.isHost(recvhost)) {
    host.getModel().create(recvhost).then((data) => {

      if(ios) {
        // Notify all socket.io clients
        console.log("socket.io send");
        ios.emit( "broadcast", JSON.stringify(data) );
      }   

      return res.status(200).json({ error: false, errormessage: "", id: data._id });

    }).catch((reason) => {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    })
  } else {
    return next({ statusCode:404, error: true, errormessage: "Data is not a valid host" });
  }

});


app.put("/api/v1/hosts/:hostid", auth, ensureModeratorRole , (req,res,next) => {

 console.log("Update request for host with id: "+req.params.hostid)
 let recvhost= req.body;

  if(host.isHost(recvhost)) {
    host.getModel().updateOne({_id:req.params.hostid}, recvhost ).then(
      (q) => {

        if( q.modifiedCount > 0 )
          return res.status(200).json( {error:false, errormessage:""} );
        else
          return next({ statusCode:404, error: true, errormessage: "Data is not a valid host"});

    }).catch((reason) => {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
    })
  } else {
    return next({ statusCode:404, error: true, errormessage: "Data is not a valid host" });
  }

});


app.get("/api/v1/hosts/:hostid", auth, (req,res,next) => {

  host.getModel().findOne( {_id: req.params.hostid } ).then( 
    ( q )=> {
      if( q )
        return res.status(200).json( {q} );
      else 
        return res.status(404).json( {error:true, errormessage:"no host with that ID present"} );
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});


app.delete("/api/v1/hosts/:hostid", auth, ensureModeratorRole , (req,res,next) => {

  host.getModel().deleteOne( {_id: req.params.hostid } ).then( 
    ( q )=> {
      if( q.deletedCount > 0 )
        return res.status(200).json( {error:false, errormessage:""}  );
      else 
        return res.status(404).json( {error:true, errormessage:"no host with that ID present"} );
  }).catch( (reason)=> {
      return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});




/////////
// User
////////



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
      return next({ statusCode:404, error: true, errormessage: "Cannot delete an admin user" });

    user.deleteOne().then( () => {
      return res.status(200).json( {error:false, errormessage:"" } );
    });

  }).catch( (reason) => {
    return next({ statusCode:404, error: true, errormessage: "DB error: "+reason });
  })

});




// Configure HTTP basic authentication strategy 
// trough passport middleware.
// NOTE: Always use HTTPS with Basic Authentication

passport.use( new passportHTTP.BasicStrategy(
  function(username, password, done) {

    // "done" callback (verify callback) documentation:  http://www.passportjs.org/docs/configure/

    // Delegate function we provide to passport middleware
    // to verify user credentials 

    console.log("New login attempt from ".green + username );

    user.getModel().findOne( {mail: username}).then( (user)=>{

      if( !user ) {
        return done( {statusCode: 500, error: true, errormessage:"Invalid user"} );
      }

      if( user.validatePassword( password ) ) {
        // user exists and password is valid!
        return done(null, user);
      }

      return done( {statusCode: 500, error: true, errormessage:"Invalid password"} );

    }).catch( ( err ) => {
        return done( {statusCode: 500, error: true, errormessage:err} );
   });
  }
));


// Login endpoint uses passport middleware to check
// user credentials before generating a new JWT
app.get("/api/v1/login", passport.authenticate('basic', { session: false }), (req,res,next) =>  {

  if( !req.user )
    return res.status(500).json( {statusCode: 500, error: true, errormessage:"Login error"} );

  // If we reach this point, the user is successfully authenticated and
  // has been injected into req.user

  // We now generate a JWT with the useful user data
  // and return it as response

  let tokendata = {
    username: req.user.username,
    roles: req.user.roles,
    mail: req.user.mail,
    id: req.user.id
  };

  console.log("Login granted. Generating token" );
  const token_signed = jsonwebtoken.sign(tokendata, String(process.env.JWT_SECRET), { expiresIn: '1h' } );

  // Note: You can manually check the JWT content at https://jwt.io

  return res.status(200).json({ error: false, errormessage: "", token: token_signed });

});



// Add a global error handling middleware
app.use(( (err,req,res,next) => {

  console.log("Request error: ".red + JSON.stringify(err) );
  res.status( err.statusCode || 500 ).json( err );

} ) as express.ErrorRequestHandler);



// The very last middleware will report an error 404 
// (will be eventually reached if no error occurred and if
//  the requested endpoint is not matched by any route)
//
app.use( (req,res,next) => {
  res.status(404).json({statusCode:404, error:true, errormessage: "Invalid endpoint: " + req} );
})




//////////////////////////////////////////////////////////////////////////////
//      Application bootstrap
//////////////////////////////////////////////////////////////////////////////


// Connect to mongodb and launch the HTTP server trough Express
//
mongoose.connect( 'mongodb://mymongo:27017/mobility_application' )
.then( 
  () => {

    console.log("Connected to MongoDB");

    return user.getModel().findOne( {mail:"admin@cafoscari.it"} );
  }
).then(
  (doc) => {
    if (!doc) {
      console.log("Creating admin user");

      let u = user.newUser({
        username: "admin",
        mail: "admin@cafoscari.it"
      });
      u.setAdmin();
      u.setModerator();
      u.setPassword("admin");
      return u.save()
    } else {
      console.log("Admin user already exists");
    }
  }
)
.then(
  () => {
    return user.getModel().findOne( {mail:"123456@stud.unive.it"} );
  }
)
.then(
  (doc) => {
    if (!doc) {
      console.log("Creating random user");

      let u = user.newUser({
        username: "123456",
        mail: "123456@stud.unive.it"
      });
      u.setPassword("123456");
      return u.save()
    } else {
      console.log("Random user already exists");
    }
  }
)
.then(
  () => {
    return application.getModel().countDocuments({})
  }
).then(
  async (count) => {
    if (count == 0) {
      console.log("Adding some test into the database");

      let host1 = host
        .getModel()
        .create({
          name: "University of Edinburgh",
          mail: "test@ed.ac.uk",
          country: "Scotland",
        });

        const file = await open('./asset/learning_agreement.pdf');
        let contents;
        try{
          contents = await file.readFile();
          console.log("File read successfully");
        } catch (err) {
          console.log("Error reading file" + err);
          throw err;
        } finally {
          await file.close();
        }

      let agreement1 = agreement
        .getModel()
        .create({
          filename: "learning_agreement.pdf",
          content:  contents,
          mimetype:  "application/pdf",
          uploadDate: new Date(),
          applicationid: "123",
          matrNumber: "123456",
          approved: false,
          modified: false,
          lecturerReason: 'No reason provided',
        });
      

      let transcriptRecords1 = transcriptRecord
        .getModel()
        .create({
          records: [
            { code: "CS101", grade: 25 },
            { code: "CS102", grade: 26 },
            { code: "CS103", grade: 27 }
          ],
          uploadDate: new Date(),
          applicationid: "123",
          matrNumber: "123456",
        });

        
      let application1 = application
        .getModel()
        .create({
          id: "123",
          status: "Pending",
          uploadDate: new Date(),
          academicYear: "2023-2024",
          semester: "Spring",
          matrNumber: "123456",
          name: "John",
          surname: "Snow",
          departement: "Computer Science",
          sendingInst: "University of Venezia",
          sendingCountry: "Italy",
          hostInst: "University of Edinburgh",
          hostCountry: "Scotland",
          courses: [
            { 
              originalCourse: { code: "CS101", title: "Introduction to Computer Science", credits: 6 }, 
              equivalentCourse: { code: "CS999", title: "Algorithm and data structures", credits: 12 } 
            }
          ],
          referent: "Tyrion Lannister",
          approved: false,
          modified: false,
          lecturerReason: 'No reason provided',
        });

        


      return Promise.all([agreement1, application1, transcriptRecords1,host1]);
      }
    }
).then(      
  () => {
    let server = http.createServer(app);

    ios = new SocketIOServer(server, {
      cors: {
        origin: ["http://localhost:4200", "http://localhost:4201", "http://localhost:8080"] // See: https://socket.io/docs/v4/handling-cors/#configuration
      }
    });

    ios.on('connection', function (client) {
      console.log("Socket.io client connected".green);
    });

    server.listen(8080, () => console.log("HTTP Server started on port 8080".green));

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
  }
).catch(
  (err) => {
    console.log("Error Occurred during initialization".red );
    console.log(err);
  }
)








/*

123456@stud.unive.it

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYWlsIjoiMTIzNDU2QHN0dWQudW5pdmUuaXQiLCJ1c2VybmFtZSI6IjEyMzQ1NiJ9.YXM6JAk34rW3Y0EX2xiNPNsfJLCq5DXDjQ0HAm4E2mY



admin@cafoscari.it


eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYWlsIjoiYWRtaW5AY2Fmb3NjYXJpLml0IiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGVzIjpbIkFETUlOIiwiTU9ERVJBVE9SIl19.LINiAYxZiKprBWVLbLn9La2yPAiISamitJ03jLcbLuY

*/



















