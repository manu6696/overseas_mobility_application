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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const result = require('dotenv').config(); // The dotenv module will load a file named ".env"
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
const http = require("http"); // HTTP module
const colors = require("colors");
colors.enabled = true;
const mongoose = require("mongoose");
const application = __importStar(require("./Application"));
const agreement = __importStar(require("./Agreement"));
const transcriptRecord = __importStar(require("./TranscriptRecord"));
const user = __importStar(require("./User"));
const host = __importStar(require("./Host"));
const express = require("express");
const multer = require("multer");
const passport = require("passport"); // authentication middleware for Express
const passportHTTP = require("passport-http"); // implements Basic and Digest authentication for HTTP (used for /login endpoint)
const jsonwebtoken = require("jsonwebtoken"); // JWT generation
const { expressjwt: jwt } = require('express-jwt'); // JWT parsing middleware for express
const cors = require("cors"); // Enable CORS middleware
const socket_io_1 = require("socket.io"); // Socket.io websocket library
const promises_1 = require("node:fs/promises");
let ios = undefined;
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
let auth = jwt({
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
    return (req, res, next) => {
        req.body.roles = []; // this is to avoid users to create themselves as admins or moderators
        let newuser = user.newUser(req.body);
        if (!req.body.password) {
            return next({ statusCode: 404, error: true, errormessage: "Password field missing" });
        }
        newuser.setPassword(req.body.password);
        if (isModerator)
            newuser.setModerator();
        else
            newuser.setStudent();
        console.log(`Creating new user ${newuser.username}, moderator: ${newuser.hasModeratorRole()}`);
        newuser.save().then((data) => {
            return res.status(200).json({ error: false, errormessage: "", id: data._id });
        }).catch((reason) => {
            if (reason.code === 11000)
                return next({ statusCode: 404, error: true, errormessage: "User already exists" });
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason.errmsg });
        });
    };
}
// -------------- END OF MIDDLEWARES DEFINITION ----------------------
let app = express();
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
app.use((req, res, next) => {
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
  LOGIN -> GET, POST
  USERS -> GET, POST, DELETE, PUT
  APPLICATIONS -> GET, POST, DELETE, PUT
  LEARNING AGREEMENTS -> GET, POST, DELETE, PUT (APPROVED / MODIFIED sono campi della risorsa)
  TRANSCRIPTS OF RECORDS -> GET, POST, DELETE, PUT
  HOST INSTITUTIONS -> GET, POST, DELETE, PUT
*/
app.get("/api/v1", (req, res) => {
    res.status(200).json({ api_version: "1.0", endpoints: ["/applications", "/agreements", "/transcriptRecords", "/hosts", "/users", "/login"] }); // json method sends a JSON response (setting the correct Content-Type) to the client
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
    agreementApproved: Boolean,
    modified: Boolean,
    lecturerReason: String
}
*/
app.get("/api/v1/applications/:matrNumber", auth, (req, res, next) => {
    if (req.auth.username === req.params.matrNumber) {
        application.getModel().find({ matrNumber: req.params.matrNumber }).then((q) => {
            if (q.length > 0)
                return res.status(200).json({ q });
            else
                return res.status(404).json({ error: true, errormessage: "no application present" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return res.status(404).json({ error: true, errormessage: "No correct authorization for this application" });
    }
});
app.get("/api/v1/applications/", auth, (req, res, next) => {
    console.log(req.query);
    if (req.auth.roles.includes('LECTURER') && req.query.referent && req.auth.username === req.query.referent) {
        application.getModel().find({ referent: req.query.referent }).then((q) => {
            if (q.length > 0)
                return res.status(200).json({ q });
            else
                return res.status(404).json({ error: true, errormessage: "no application present" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else if (req.auth.roles.includes('STUDENT') && req.query.matrNumber && req.auth.username === req.query.matrNumber) {
        application.getModel().find({ matrNumber: req.query.matrNumber }).then((q) => {
            if (q.length > 0)
                return res.status(200).json({ q });
            else
                return res.status(404).json({ error: true, errormessage: "no application present" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else if (req.auth.roles.includes('STAFF')) {
        application.getModel().find().then((q) => {
            if (q.length > 0)
                return res.status(200).json({ q });
            else
                return res.status(404).json({ error: true, errormessage: "no application present" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return res.status(404).json({ error: true, errormessage: "no valid query parameters or not valid authorization" });
    }
});
app.post("/api/v1/applications/:matrNumber", auth, async (req, res, next) => {
    console.log("Received: " + JSON.stringify(req.body));
    let recvapplications = req.body;
    recvapplications.status = 'Created';
    recvapplications.matrNumber = req.params.matrNumber;
    recvapplications.agreementApproved = false;
    recvapplications.modified = false;
    recvapplications.lecturerReason = 'No reason provided';
    recvapplications.uploadDate = new Date();
    // The _id field is generated from mongoDB
    if (!recvapplications._id) {
        delete recvapplications._id;
    }
    if (application.isApplication(recvapplications) && !req.params.matrNumber.includes('matrNumber') && req.auth.username === req.params.matrNumber) {
        const data = await application.getModel().create(recvapplications).then((data) => {
            if (ios) {
                // Notify all socket.io clients
                console.log("socket.io send");
                ios.emit("broadcast", JSON.stringify(data));
            }
            return res.status(200).json({ error: false, errormessage: "", _id: data._id });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Data is not a valid application or not valid authorization" });
    }
});
app.put("/api/v1/applications/:applicationid", auth, (req, res, next) => {
    console.log("Update request for application with id: " + req.params.applicationid);
    console.log(req.query);
    if (req.body && Object.keys(req.body).length > 0) {
        let recvapplications = req.body;
        recvapplications.uploadDate = new Date();
        recvapplications.modified = true;
        if ((req.auth.roles.includes('LECTURER') && req.auth.username === recvapplications.referent) || req.auth.roles.includes('STAFF')) {
            recvapplications.status = req.body.status;
            if (req.body.agreementApproved === 'true' || req.body.agreementApproved === 'True' || req.body.agreementApproved === true) {
                recvapplications.agreementApproved = true;
            }
            else {
                recvapplications.agreementApproved = false;
            }
            recvapplications.lecturerReason = req.body.lecturerReason || 'No reason provided';
        }
        else {
            recvapplications.agreementApproved = false;
            recvapplications.lecturerReason = 'No reason provided';
        }
        if (req.auth.username === recvapplications.referent || req.auth.username === recvapplications.matrNumber || req.auth.roles.includes('STAFF')) {
            application.getModel().updateOne({ _id: req.params.applicationid }, recvapplications).then((q) => {
                if (q.matchedCount > 0)
                    return res.status(200).json({ error: false, errormessage: "" });
                else
                    return next({ statusCode: 404, error: true, errormessage: "Data is not a valid application" });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Application missing" });
    }
});
app.delete("/api/v1/applications/:applicationid", auth, (req, res, next) => {
    console.log("Delete request for application with id: " + req.params.applicationid);
    application.getModel().deleteOne({ _id: req.params.applicationid }).then((q) => {
        if (q.deletedCount > 0)
            return res.status(200).json({ error: false, errormessage: "" });
        else
            return res.status(404).json({ error: true, errormessage: "Invalid application id" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
///////////////////////
// Learning Agreements
///////////////////////
// Multer used for handling pdf file
// The file is not stored on disk but in database as a Buffer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.post("/api/v1/agreements/:applicationid", auth, upload.single('agreement'), (req, res, next) => {
    console.log("Received mimetype: " + JSON.stringify(req.file.mimetype));
    console.log("Received bytes: " + JSON.stringify(req.file.buffer.byteLength));
    if (req.file && req.file.buffer.byteLength > 0 && req.file.mimetype === 'application/pdf') {
        console.log("Received: " + JSON.stringify(req.body));
        //console.log("Received file: " + JSON.stringify(req.file) );
        let recvagreements = req.body;
        recvagreements.filename = req.file.originalname;
        recvagreements.content = req.file.buffer;
        recvagreements.mimetype = req.file.mimetype;
        recvagreements.uploadDate = new Date();
        recvagreements.applicationid = req.params.applicationid;
        recvagreements.matrNumber = req.body.matrNumber;
        recvagreements.approved = 'Pending';
        recvagreements.modified = true;
        recvagreements.modifyDescription = req.body.modifyDescription;
        recvagreements.lecturerReason = 'No reason provided';
        recvagreements.decisionDate = new Date();
        if (typeof recvagreements.courses === 'string') {
            recvagreements.courses = JSON.parse(recvagreements.courses);
        }
        if (agreement.isAgreement(recvagreements)) {
            agreement.getModel().create(recvagreements).then((data) => {
                if (ios) {
                    // Notify all socket.io clients
                    console.log("socket.io send");
                    ios.emit("broadcast", JSON.stringify(data));
                }
                return res.status(200).json({ error: false, errormessage: "", id: data._id });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
        else {
            return next({ statusCode: 404, error: true, errormessage: "Data is not a valid learning agreement" });
        }
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Learning agreement missing or not a PDF file" });
    }
});
app.get("/api/v1/agreements/:agreementid", auth, (req, res, next) => {
    agreement.getModel().findOne({ _id: req.params.agreementid }).then((q) => {
        if (q) {
            res.setHeader('Content-Type', 'application/pdf');
            return res.status(200).send(q.content);
        }
        else
            return res.status(404).json({ error: true, errormessage: "Invalid agreement id" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.get("/api/v1/agreements/", auth, (req, res, next) => {
    if (req.query.applicationid) {
        agreement.getModel().find({ applicationid: req.query.applicationid }, { content: 0 }).then((q) => {
            //const selectedAgreement = q[0];
            if (q.length > 0) {
                //res.setHeader('Content-Type', 'application/pdf');
                return res.status(200).send({ q });
                //return res.status(200).json( {q} );
            }
            else
                return res.status(404).json({ error: true, errormessage: "Invalid application id" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else if (req.query.matrNumber) {
        agreement.getModel().find({ matrNumber: req.query.matrNumber }).then((q) => {
            if (q.length > 0)
                return res.status(200).json({ q });
            else
                return res.status(404).json({ error: true, errormessage: "Invalid matriculation number" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return res.status(404).json({ error: true, errormessage: "no valid query parameters" });
    }
});
app.delete("/api/v1/agreements/:applicationid", auth, (req, res, next) => {
    console.log("Delete request for learning agreement with application id: " + req.params.applicationid);
    agreement.getModel().deleteMany({ applicationid: req.params.applicationid }).then((q) => {
        if (q.deletedCount > 0)
            return res.status(200).json({ error: false, errormessage: "" });
        else
            return res.status(404).json({ error: true, errormessage: "Invalid application id" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.put("/api/v1/agreements/:agreementid", auth, upload.single('agreement'), (req, res, next) => {
    console.log("Update request for learning agreement with id: " + req.params.agreementid);
    console.log("Received: " + JSON.stringify(req.body));
    let recvagreements = req.body;
    if (recvagreements.uploadDate && typeof recvagreements.uploadDate === 'string') {
        recvagreements.uploadDate = new Date(recvagreements.uploadDate);
    }
    if (recvagreements.decisionDate && typeof recvagreements.decisionDate === 'string') {
        recvagreements.decisionDate = new Date(recvagreements.decisionDate);
    }
    if (req.file) {
        console.log("Received mimetype: " + JSON.stringify(req.file.mimetype));
        console.log("Received bytes: " + JSON.stringify(req.file.buffer.byteLength));
        recvagreements.filename = req.file.originalname;
        recvagreements.content = req.file.buffer;
        recvagreements.mimetype = req.file.mimetype;
        recvagreements.uploadDate = new Date();
    }
    recvagreements.applicationid = req.body.applicationid;
    recvagreements.matrNumber = req.body.matrNumber;
    recvagreements.approved = req.body.approved;
    recvagreements.modified = true;
    recvagreements.modifyDescription = req.body.modifyDescription;
    recvagreements.lecturerReason = req.body.lecturerReason || 'No reason provided';
    if (agreement.isPartialAgreement(recvagreements)) {
        agreement.getModel().updateOne({ _id: req.params.agreementid }, recvagreements).then((q) => {
            if (q.matchedCount > 0) {
                let agreementApproved = false;
                if (recvagreements.approved === 'Approved') {
                    agreementApproved = true;
                }
                application.getModel().updateOne({ _id: recvagreements.applicationid }, { agreementApproved: agreementApproved }).then((q) => {
                    if (q.matchedCount > 0)
                        return res.status(200).json({ error: false, errormessage: "" });
                    else
                        return next({ statusCode: 404, error: true, errormessage: "Data is not a valid application" });
                }).catch((reason) => {
                    return next({ statusCode: 500, error: true, errormessage: "DB error: " + reason });
                });
            }
            else {
                return next({ statusCode: 404, error: true, errormessage: "Data is not a valid learning agreement" });
            }
        }).catch((reason) => {
            return next({ statusCode: 500, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return next({ statusCode: 400, error: true, errormessage: "Data is not a valid learning agreement" });
    }
});
/////////////////////////
// Transcript of Records
/////////////////////////
app.post("/api/v1/transcriptRecords", auth, upload.single('transcriptRecords'), (req, res, next) => {
    console.log("Received mimetype: " + JSON.stringify(req.file.mimetype));
    console.log("Received bytes: " + JSON.stringify(req.file.buffer.byteLength));
    if (req.file && req.file.buffer.byteLength > 0 && req.file.mimetype === 'application/pdf') {
        console.log("Received: " + JSON.stringify(req.body));
        let recvtranscriptRecords = req.body;
        recvtranscriptRecords.filename = req.file.originalname;
        recvtranscriptRecords.content = req.file.buffer;
        recvtranscriptRecords.mimetype = req.file.mimetype;
        recvtranscriptRecords.uploadDate = new Date();
        recvtranscriptRecords.applicationid = req.body.applicationid;
        recvtranscriptRecords.matrNumber = req.body.matrNumber;
        recvtranscriptRecords.records = JSON.parse(req.body.records);
        if (transcriptRecord.isTranscriptRecord(recvtranscriptRecords)) {
            transcriptRecord.getModel().create(recvtranscriptRecords).then((data) => {
                if (ios) {
                    // Notify all socket.io clients
                    console.log("socket.io send");
                    ios.emit("broadcast", JSON.stringify(data));
                }
                return res.status(200).json({ error: false, errormessage: "", id: data._id });
            }).catch((reason) => {
                return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
            });
        }
        else {
            return next({ statusCode: 404, error: true, errormessage: "Data is not a valid transcript of records" });
        }
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Transcript of records missing or not a PDF file" });
    }
});
app.get("/api/v1/transcriptRecords/:applicationid", auth, (req, res, next) => {
    // req.params.applicationid contains the :applicationid URL component
    transcriptRecord.getModel().findOne({ applicationid: req.params.applicationid }, { content: 0 }).then((q) => {
        if (q)
            return res.status(200).json({ q });
        else
            return res.status(404).json({ error: true, errormessage: "no transcript of records present" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.get("/api/v1/transcriptRecords/:applicationid/file", auth, (req, res, next) => {
    transcriptRecord.getModel().findOne({ applicationid: req.params.applicationid }).then((q) => {
        if (q) {
            res.setHeader('Content-Type', 'application/pdf');
            return res.status(200).send(q.content);
        }
        else
            return res.status(404).json({ error: true, errormessage: "no file present" });
    }).catch((reason) => {
        return next({ statusCode: 500, error: true, errormessage: "DB error: " + reason });
    });
});
app.delete("/api/v1/transcriptRecords/:applicationid", auth, (req, res, next) => {
    console.log("Delete request for transcript of records with application id: " + req.params.applicationid);
    // req.params.applicationid contains the :applicationid URL component
    transcriptRecord.getModel().deleteMany({ applicationid: req.params.applicationid }).then((q) => {
        if (q.deletedCount > 0)
            return res.status(200).json({ error: false, errormessage: "" });
        else
            return res.status(404).json({ error: true, errormessage: "Invalid application ID" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.put("/api/v1/transcriptRecords/:applicationid", auth, upload.single('transcriptRecords'), (req, res, next) => {
    console.log("Body ricevuto:", JSON.stringify(req.body));
    console.log("File ricevuto:", req.file ? req.file.originalname : "nessuno");
    let recvtranscriptRecords = req.body;
    if (req.file) {
        recvtranscriptRecords.filename = req.file.originalname;
        recvtranscriptRecords.content = req.file.buffer;
        recvtranscriptRecords.mimetype = req.file.mimetype;
        recvtranscriptRecords.uploadDate = new Date();
    }
    if (recvtranscriptRecords.records && typeof recvtranscriptRecords.records === 'string') {
        try {
            recvtranscriptRecords.records = JSON.parse(recvtranscriptRecords.records);
        }
        catch (e) {
            return next({ statusCode: 400, error: true, errormessage: "JSON format not valid in records" });
        }
    }
    if (!recvtranscriptRecords.records || !Array.isArray(recvtranscriptRecords.records)) {
        return next({ statusCode: 400, error: true, errormessage: "Missing or invalid records" });
    }
    if (transcriptRecord.isPartialTranscriptRecord(recvtranscriptRecords)) {
        transcriptRecord.getModel().updateOne({ applicationid: req.params.applicationid }, recvtranscriptRecords).then((q) => {
            if (q.matchedCount > 0)
                return res.status(200).json({ error: false, errormessage: "" });
            else
                return next({ statusCode: 404, error: true, errormessage: "Application not found" });
        }).catch((reason) => {
            return next({ statusCode: 500, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return next({ statusCode: 400, error: true, errormessage: "Data is not a valid transcript of records" });
    }
});
/////////////////////
// Host institutions
/////////////////////
app.get("/api/v1/hosts/", auth, (req, res, next) => {
    let skip = parseInt(req.query.skip || "0") || 0;
    let limit = parseInt(req.query.limit || "20") || 20;
    host.getModel().find().sort({ timestamp: -1 }).skip(skip).limit(limit).then((documents) => {
        return res.status(200).json(documents);
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.post("/api/v1/hosts/", auth, ensureModeratorRole, (req, res, next) => {
    console.log("Received: " + JSON.stringify(req.body));
    let recvhost = req.body;
    if (host.isHost(recvhost)) {
        host.getModel().create(recvhost).then((data) => {
            if (ios) {
                // Notify all socket.io clients
                console.log("socket.io send");
                ios.emit("broadcast", JSON.stringify(data));
            }
            return res.status(200).json({ error: false, errormessage: "", id: data._id });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Data is not a valid host" });
    }
});
app.put("/api/v1/hosts/:hostid", auth, ensureModeratorRole, (req, res, next) => {
    console.log("Update request for host with id: " + req.params.hostid);
    let recvhost = req.body;
    if (host.isHost(recvhost)) {
        host.getModel().updateOne({ _id: req.params.hostid }, recvhost).then((q) => {
            if (q.modifiedCount > 0)
                return res.status(200).json({ error: false, errormessage: "" });
            else
                return next({ statusCode: 404, error: true, errormessage: "Data is not a valid host" });
        }).catch((reason) => {
            return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
        });
    }
    else {
        return next({ statusCode: 404, error: true, errormessage: "Data is not a valid host" });
    }
});
app.get("/api/v1/hosts/:hostid", auth, (req, res, next) => {
    host.getModel().findOne({ _id: req.params.hostid }).then((q) => {
        if (q)
            return res.status(200).json({ q });
        else
            return res.status(404).json({ error: true, errormessage: "no host with that ID present" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.delete("/api/v1/hosts/:hostid", auth, ensureModeratorRole, (req, res, next) => {
    host.getModel().deleteOne({ _id: req.params.hostid }).then((q) => {
        if (q.deletedCount > 0)
            return res.status(200).json({ error: false, errormessage: "" });
        else
            return res.status(404).json({ error: true, errormessage: "no host with that ID present" });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
/////////
// User
////////
app.get('/api/v1/users', auth, ensureModeratorRole, (req, res, next) => {
    user.getModel().find({}, { digest: 0, salt: 0 }).then((users) => {
        return res.status(200).json(users);
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
app.get("/api/v1/users/lecturers", auth, (req, res, next) => {
    user.getModel().find({ roles: 'LECTURER' }, 'username name surname mail')
        .then((lecturers) => {
        return res.status(200).json({ lecturers });
    })
        .catch((reason) => {
        return next({ statusCode: 500, error: true, errormessage: "DB error: " + reason });
    });
});
app.post('/api/v1/users', adduserMiddlewareFactory(false));
app.post('/api/v1/users/moderators', auth, ensureAdminRole, adduserMiddlewareFactory(true));
app.route('/api/v1/users/:mail').get(auth, ensureModeratorRole, (req, res, next) => {
    // req.params.mail contains the :mail URL component
    user.getModel().findOne({ mail: req.params.mail }, { digest: 0, salt: 0 }).then((user) => {
        return res.status(200).json(user);
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
}).delete(auth, ensureAdminRole, (req, res, next) => {
    // lookup the user to delete
    user.getModel().findOne({ mail: req.params.mail }, { digest: 0, salt: 0 }).then((user) => {
        if (!user)
            return next({ statusCode: 404, error: true, errormessage: "Invalid user" });
        if (user.hasAdminRole())
            return next({ statusCode: 404, error: true, errormessage: "Cannot delete an admin user" });
        user.deleteOne().then(() => {
            return res.status(200).json({ error: false, errormessage: "" });
        });
    }).catch((reason) => {
        return next({ statusCode: 404, error: true, errormessage: "DB error: " + reason });
    });
});
// Configure HTTP basic authentication strategy 
// trough passport middleware.
// NOTE: Always use HTTPS with Basic Authentication
passport.use(new passportHTTP.BasicStrategy(function (username, password, done) {
    // "done" callback (verify callback) documentation:  http://www.passportjs.org/docs/configure/
    // Delegate function we provide to passport middleware
    // to verify user credentials 
    console.log("New login attempt from ".green + username);
    user.getModel().findOne({ mail: username }).then((user) => {
        if (!user) {
            return done({ statusCode: 500, error: true, errormessage: "Invalid user" });
        }
        if (user.validatePassword(password)) {
            // user exists and password is valid!
            return done(null, user);
        }
        return done({ statusCode: 500, error: true, errormessage: "Invalid password" });
    }).catch((err) => {
        return done({ statusCode: 500, error: true, errormessage: err });
    });
}));
// Login endpoint uses passport middleware to check
// user credentials before generating a new JWT
app.get("/api/v1/login", passport.authenticate('basic', { session: false }), (req, res, next) => {
    if (!req.user)
        return res.status(500).json({ statusCode: 500, error: true, errormessage: "Login error" });
    // If we reach this point, the user is successfully authenticated and
    // has been injected into req.user
    // We now generate a JWT with the useful user data
    // and return it as response
    let tokendata = {
        username: req.user.username,
        roles: req.user.roles,
        name: req.user.name,
        surname: req.user.surname,
        mail: req.user.mail,
        id: req.user.id
    };
    console.log("Login granted. Generating token");
    const token_signed = jsonwebtoken.sign(tokendata, String(process.env.JWT_SECRET), { expiresIn: '1h' });
    // Note: You can manually check the JWT content at https://jwt.io
    return res.status(200).json({ error: false, errormessage: "", token: token_signed });
});
/*
// Add a global error handling middleware
app.use(( (err,req,res,next) => {

  console.log("Request error: ", JSON.stringify(err) );
  res.status( err.statusCode || 500 ).json( err );

} ) as express.ErrorRequestHandler);
*/
app.use(((err, req, res, next) => {
    console.log("Request error:", err.message || err);
    console.log("Stack:", err.stack);
    res.status(err.statusCode || 500).json({ error: true, errormessage: err.message || "Unknown error" });
}));
// The very last middleware will report an error 404 
// (will be eventually reached if no error occurred and if
//  the requested endpoint is not matched by any route)
//
app.use((req, res, next) => {
    res.status(404).json({ statusCode: 404, error: true, errormessage: "Invalid endpoint: " + req });
});
//////////////////////////////////////////////////////////////////////////////
//      Application bootstrap
//////////////////////////////////////////////////////////////////////////////
// Connect to mongodb and launch the HTTP server trough Express
//
mongoose.connect('mongodb://mymongo:27017/mobility_application')
    .then(() => {
    console.log("Connected to MongoDB");
    return user.getModel().findOne({ mail: "admin@cafoscari.it" });
}).then((doc) => {
    if (!doc) {
        console.log("Creating admin user");
        let u = user.newUser({
            username: "admin",
            mail: "admin@cafoscari.it",
            name: "admin",
            surname: "admin"
        });
        u.setAdmin();
        u.setModerator();
        u.setStaff();
        u.setPassword("admin");
        return u.save();
    }
    else {
        console.log("Admin user already exists");
    }
})
    .then(() => {
    return user.getModel().findOne({ mail: "123456@stud.univ.it" });
})
    .then((doc) => {
    if (!doc) {
        console.log("Creating random user");
        let u = user.newUser({
            username: "123456",
            name: "Giulia",
            surname: "Conti",
            mail: "123456@stud.univ.it"
        });
        u.setStudent();
        u.setPassword("123456");
        return u.save();
    }
    else {
        console.log("Random user already exists");
    }
})
    .then(() => {
    return user.getModel().findOne({ mail: "919191@univ.it" });
})
    .then((doc) => {
    if (!doc) {
        console.log("Creating lecturer user");
        let u = user.newUser({
            username: "919191",
            name: "Mario",
            surname: "Rossi",
            mail: "919191@univ.it"
        });
        u.setLecturer();
        u.setPassword("919191");
        return u.save();
    }
    else {
        console.log("Lecturer user already exists");
    }
})
    .then(() => {
    return user.getModel().findOne({ mail: "staff@univ.it" });
})
    .then((doc) => {
    if (!doc) {
        console.log("Creating staff user");
        let u = user.newUser({
            username: "staff",
            name: "Luca",
            surname: "Bianchi",
            mail: "staff@univ.it"
        });
        u.setModerator();
        u.setStaff();
        u.setPassword("staff");
        return u.save();
    }
    else {
        console.log("Staff user already exists");
    }
})
    .then(() => {
    return application.getModel().countDocuments({});
}).then(async (count) => {
    if (count == 0) {
        console.log("Adding some test into the database");
        let host1 = host
            .getModel()
            .create({
            name: "Technical University of Munich",
            mail: "info@tum-fake.de",
            country: "Germany",
            city: "Munich",
        });
        let host2 = host
            .getModel()
            .create({
            name: "University of Edinburgh",
            mail: "contact@ed-test.ac.uk",
            country: "Scotland",
            city: "Edinburgh",
        });
        let host3 = host
            .getModel()
            .create({
            name: "University of Barcelona",
            mail: "admissions@ub-mock.es",
            country: "Spain",
            city: "Barcelona",
        });
        let host4 = host
            .getModel()
            .create({
            name: "KU Leuven",
            mail: "international@kuleuven-demo.be",
            country: "Belgium",
            city: "Leuven",
        });
        let host5 = host
            .getModel()
            .create({
            name: "Lund University",
            mail: "exchange@lund-sample.se",
            country: "Sweden",
            city: "Lund",
        });
        const fileAgreement = await (0, promises_1.open)('./asset/learning_agreement.pdf');
        let contentsAgreement;
        try {
            contentsAgreement = await fileAgreement.readFile();
            console.log("File read successfully");
        }
        catch (err) {
            console.log("Error reading file" + err);
            throw err;
        }
        finally {
            await fileAgreement.close();
        }
        const fileRecords = await (0, promises_1.open)('./asset/transcript_of_records.pdf');
        let contentsRecords;
        try {
            contentsRecords = await fileRecords.readFile();
            console.log("File read successfully");
        }
        catch (err) {
            console.log("Error reading file" + err);
            throw err;
        }
        finally {
            await fileRecords.close();
        }
        let application1 = await application
            .getModel()
            .create({
            status: "Waiting for exam score approval",
            uploadDate: new Date(),
            academicYear: "2023-2024",
            semester: "Autumn/Fall",
            matrNumber: "123456",
            name: "Giulia",
            surname: "Conti",
            departement: "Computer Science",
            sendingInst: "University of Venezia",
            sendingCountry: "Italy",
            hostInst: "University of Edinburgh",
            hostCountry: "Scotland",
            hostCity: "Edinburgh",
            courses: [
                {
                    originalCourse: { code: "CS101", title: "Sistemi Distribuiti", credits: 6 },
                    equivalentCourse: { code: "CS201", title: "Distributed Systems", credits: 6 }
                },
                {
                    originalCourse: { code: "CS102", title: "Machine Learning", credits: 8 },
                    equivalentCourse: { code: "CS305", title: "Machine Learning Fundamentals", credits: 8 }
                }
            ],
            referent: "919191",
            agreementApproved: false,
            modified: false,
            lecturerReason: 'No reason provided',
        });
        let transcriptRecords1 = await transcriptRecord
            .getModel()
            .create({
            filename: "transcript_of_records.pdf",
            content: contentsRecords,
            mimetype: "application/pdf",
            records: [
                { code: "CS201", grade: "25", approved: "Pending" },
                { code: "CS305", grade: "26", approved: "Pending" }
            ],
            uploadDate: new Date(),
            applicationid: application1._id,
            matrNumber: "123456",
        });
        let agreement1 = await agreement
            .getModel()
            .create({
            filename: "learning_agreement.pdf",
            content: contentsAgreement,
            mimetype: "application/pdf",
            uploadDate: new Date(),
            applicationid: application1._id,
            matrNumber: "123456",
            approved: "Pending",
            modified: false,
            lecturerReason: 'No reason provided',
            modifyDescription: "Initial Learning Agreement",
            decisionDate: new Date(),
            courses: [
                {
                    originalCourse: { code: "CS101", title: "Sistemi Distribuiti", credits: 6 },
                    equivalentCourse: { code: "CS201", title: "Distributed Systems", credits: 6 }
                },
                {
                    originalCourse: { code: "CS102", title: "Machine Learning", credits: 8 },
                    equivalentCourse: { code: "CS305", title: "Machine Learning Fundamentals", credits: 8 }
                }
            ]
        });
        return Promise.all([agreement1, application1, transcriptRecords1, host1, host2, host3, host4, host5]);
    }
}).then(() => {
    let server = http.createServer(app);
    ios = new socket_io_1.Server(server, {
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
}).catch((err) => {
    console.log("Error Occurred during initialization".red);
    console.log(err);
});
//# sourceMappingURL=mobility_application.js.map