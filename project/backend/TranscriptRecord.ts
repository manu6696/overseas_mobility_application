
import mongoose = require('mongoose');


interface CourseResult {
  code: String,
  grade: String,
  approved: String
}

export interface TranscriptRecord {
    records: CourseResult[],
    uploadDate: Date,
    applicationid: String,
    matrNumber: String
}

// User defined type guard
// Type checking cannot be performed during the execution (we don't have the TranscriptRecord interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
export function isTranscriptRecord(arg: any): arg is TranscriptRecord {
    return arg 
    && arg.applicationid && typeof(arg.applicationid) == 'string'
    && arg.matrNumber && typeof(arg.matrNumber) == 'string' 
    && arg.records && Array.isArray(arg.records) 
    && arg.uploadDate && arg.uploadDate instanceof Date
}




// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the TranscriptRecord interface with the TranscriptRecordSchema 
//
// Mongoose Schema.

const CourseResultSchema = new mongoose.Schema<CourseResult>({
    code: { 
        type: String, 
        required: true 
    },
    grade: { 
        type: String, 
        required: true 
    },
    approved: { 
        type: String, 
        required: true 
    }
}, { _id: false });

let TranscriptRecordSchema = new mongoose.Schema<TranscriptRecord>( {
    records: {
        type: [CourseResultSchema],
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
        required: true
    }
})

export function getSchema() { return TranscriptRecordSchema; }

// Mongoose Model
let TranscriptRecordModel:mongoose.Model<TranscriptRecord>|undefined;  // This is not exposed outside the model

export function getModel() : mongoose.Model< TranscriptRecord > { // Return Model as singleton
    if( !TranscriptRecordModel ) {
        TranscriptRecordModel = mongoose.model('TranscriptRecord', getSchema() )
    }
    return TranscriptRecordModel;
}