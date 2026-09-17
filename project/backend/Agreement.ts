
import mongoose = require('mongoose');
import { Course, CourseEval } from './Application';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Agreement {
    filename: String,
    content: string,
    mimetype: String,
    uploadDate: Date,
    applicationid: String,
    matrNumber: String,
    approved: ApprovalStatus,
    modified: Boolean,
    modifyDescription: String,
    lecturerReason: String,
    decisionDate: Date,
    courses: CourseEval[],
}

// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Agreement interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
export function isAgreement(arg: any): arg is Agreement {
    return arg 
    && arg.content && typeof(arg.content) == 'string'
    && arg.applicationid && typeof(arg.applicationid) == 'string'
    && arg.matrNumber && typeof(arg.matrNumber) == 'string' 
    && arg.filename && typeof(arg.filename) == 'string' 
    && arg.mimetype && typeof(arg.mimetype) == 'string'
    && arg.uploadDate && arg.uploadDate instanceof Date
    && arg.courses && Array.isArray(arg.courses)
    && typeof(arg.modified) == 'boolean'
}


export function isPartialAgreement(arg: any): arg is Agreement {
    const hasValidData = arg
        && arg.applicationid && typeof(arg.applicationid) == 'string'
        && arg.matrNumber && typeof(arg.matrNumber) == 'string' 
        && arg.uploadDate && arg.uploadDate instanceof Date
        && arg.courses && Array.isArray(arg.courses)
        && typeof(arg.modified) == 'boolean';

    const hasFile = arg.content;
    const hasValidFile = !hasFile || (
        arg.content && typeof(arg.content) == 'string'
        && arg.filename && typeof(arg.filename) == 'string' 
        && arg.mimetype && typeof(arg.mimetype) == 'string'
    );   
    return hasValidData && hasValidFile;
}


// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the Agreement interface with the Agreementchema 
//
// Mongoose Schema.

const CourseSchema = new mongoose.Schema<Course>({

    code: {
        type: String, 
        required: true
    },

    title: {
        type: String, 
        required: true
    },

    credits: {
        type: String, 
        required: true
    }


}, { _id: false });

const CourseEvalSchema = new mongoose.Schema<CourseEval>({

    originalCourse: {
        type: CourseSchema,
        required: true
    },

    equivalentCourse: {
        type: CourseSchema,
        required: true
    }
})

let AgreementSchema = new mongoose.Schema<Agreement>( {

    filename: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    content: {
        type: mongoose.SchemaTypes.String,
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
        type: mongoose.SchemaTypes.String,
        required: false
    },
    modified: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    modifyDescription: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    lecturerReason: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    decisionDate: {
        type: mongoose.SchemaTypes.Date,
        required: false
    },
    courses: {
        type: [CourseEvalSchema],
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