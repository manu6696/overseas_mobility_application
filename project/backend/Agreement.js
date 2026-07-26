"use strict";
exports.__esModule = true;
exports.getModel = exports.getSchema = exports.isAgreement = void 0;
var mongoose = require("mongoose");
// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Agreement interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
function isAgreement(arg) {
    return arg
        && arg.content
        && arg.applicationid && typeof (arg.applicationid) == 'string'
        && arg.matrNumber && typeof (arg.matrNumber) == 'string'
        && arg.filename && typeof (arg.filename) == 'string'
        && arg.mimetype && typeof (arg.mimetype) == 'string'
        && arg.uploadDate && arg.uploadDate instanceof Date
        && typeof (arg.approved) == 'boolean'
        && typeof (arg.modified) == 'boolean'
        && typeof (arg.lecturerReason) == 'string';
}
exports.isAgreement = isAgreement;
// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the Agreement interface with the Agreementchema 
//
// Mongoose Schema.
var AgreementSchema = new mongoose.Schema({
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
        required: true
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
});
function getSchema() { return AgreementSchema; }
exports.getSchema = getSchema;
// Mongoose Model
var AgreementModel; // This is not exposed outside the model
function getModel() {
    if (!AgreementModel) {
        AgreementModel = mongoose.model('Agreement', getSchema());
    }
    return AgreementModel;
}
exports.getModel = getModel;
