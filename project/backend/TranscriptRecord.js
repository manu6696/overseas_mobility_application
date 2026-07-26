"use strict";
exports.__esModule = true;
exports.getModel = exports.getSchema = exports.isTranscriptRecord = void 0;
var mongoose = require("mongoose");
// User defined type guard
// Type checking cannot be performed during the execution (we don't have the TranscriptRecord interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
function isTranscriptRecord(arg) {
    return arg
        && arg.applicationID && typeof (arg.applicationID) == 'string'
        && arg.matrNumber && typeof (arg.matrNumber) == 'string'
        && arg.records && Array.isArray(arg.records)
        && arg.uploadDate && arg.uploadDate instanceof Date;
}
exports.isTranscriptRecord = isTranscriptRecord;
// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the TranscriptRecord interface with the TranscriptRecordSchema 
//
// Mongoose Schema.
var CourseResultSchema = new mongoose.Schema({
    code: { type: Number, required: true },
    grade: { type: Number, required: true }
}, { _id: false });
var TranscriptRecordSchema = new mongoose.Schema({
    records: {
        type: [CourseResultSchema],
        required: true
    },
    uploadDate: {
        type: mongoose.SchemaTypes.Date,
        required: true
    },
    applicationID: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    matrNumber: {
        type: mongoose.SchemaTypes.String,
        required: true
    }
});
function getSchema() { return TranscriptRecordSchema; }
exports.getSchema = getSchema;
// Mongoose Model
var TranscriptRecordModel; // This is not exposed outside the model
function getModel() {
    if (!TranscriptRecordModel) {
        TranscriptRecordModel = mongoose.model('TranscriptRecord', getSchema());
    }
    return TranscriptRecordModel;
}
exports.getModel = getModel;
