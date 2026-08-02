"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTranscriptRecord = isTranscriptRecord;
exports.getSchema = getSchema;
exports.getModel = getModel;
const mongoose = require("mongoose");
// User defined type guard
// Type checking cannot be performed during the execution (we don't have the TranscriptRecord interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
function isTranscriptRecord(arg) {
    return arg
        && arg.applicationid && typeof (arg.applicationid) == 'string'
        && arg.matrNumber && typeof (arg.matrNumber) == 'string'
        && arg.records && Array.isArray(arg.records)
        && arg.uploadDate && arg.uploadDate instanceof Date;
}
// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the TranscriptRecord interface with the TranscriptRecordSchema 
//
// Mongoose Schema.
const CourseResultSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    grade: {
        type: Number,
        required: true
    }
}, { _id: false });
let TranscriptRecordSchema = new mongoose.Schema({
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
});
function getSchema() { return TranscriptRecordSchema; }
// Mongoose Model
let TranscriptRecordModel; // This is not exposed outside the model
function getModel() {
    if (!TranscriptRecordModel) {
        TranscriptRecordModel = mongoose.model('TranscriptRecord', getSchema());
    }
    return TranscriptRecordModel;
}
//# sourceMappingURL=TranscriptRecord.js.map