
import mongoose = require('mongoose');


export interface Agreement {
    filename: String,
    content: Buffer,
    mimetype: String,
    uploadDate: Date,
    applicationid: String,
    matrNumber: String,
    approved: Boolean,
    modified: Boolean,
    lecturerReason: String
}

// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Agreement interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
export function isAgreement(arg: any): arg is Agreement {
    return arg 
    && arg.content.byteLength > 0
    && arg.applicationid && typeof(arg.applicationid) == 'string'
    && arg.matrNumber && typeof(arg.matrNumber) == 'string' 
    && arg.filename && typeof(arg.filename) == 'string' 
    && arg.mimetype && typeof(arg.mimetype) == 'string'
    && arg.uploadDate && arg.uploadDate instanceof Date
    && typeof(arg.approved) == 'boolean'
    && typeof(arg.modified) == 'boolean'
    && typeof(arg.lecturerReason) == 'string'
}




// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the Agreement interface with the Agreementchema 
//
// Mongoose Schema.

let AgreementSchema = new mongoose.Schema<Agreement>( {

    filename: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    content: {
        type: Buffer,
        required: true
    },
    mimetype: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    uploadDate: {
        type: mongoose.SchemaTypes.Date,
        required: true
    },
    applicationid: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    matrNumber: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    approved: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    modified: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    lecturerReason: {
        type: mongoose.SchemaTypes.String,
        required: true
    }
})

export function getSchema() { return AgreementSchema; }

// Mongoose Model
let AgreementModel:mongoose.Model<Agreement>|undefined;  // This is not exposed outside the model

export function getModel() : mongoose.Model< Agreement > { // Return Model as singleton
    if( !AgreementModel ) {
        AgreementModel = mongoose.model('Agreement', getSchema() )
    }
    return AgreementModel;
}