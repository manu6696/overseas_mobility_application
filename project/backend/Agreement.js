"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAgreement = isAgreement;
exports.getSchema = getSchema;
exports.getModel = getModel;
const mongoose = require("mongoose");
// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Agreement interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
function isAgreement(arg) {
    return arg
        && arg.content.byteLength > 0
        && arg.applicationid && typeof (arg.applicationid) == 'string'
        && arg.matrNumber && typeof (arg.matrNumber) == 'string'
        && arg.filename && typeof (arg.filename) == 'string'
        && arg.mimetype && typeof (arg.mimetype) == 'string'
        && arg.uploadDate && arg.uploadDate instanceof Date
        && typeof (arg.modified) == 'boolean';
}
// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the Agreement interface with the Agreementchema 
//
// Mongoose Schema.
let AgreementSchema = new mongoose.Schema({
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
    }
});
function getSchema() { return AgreementSchema; }
// Mongoose Model
let AgreementModel; // This is not exposed outside the model
function getModel() {
    if (!AgreementModel) {
        AgreementModel = mongoose.model('Agreement', getSchema());
    }
    return AgreementModel;
}
//# sourceMappingURL=Agreement.js.map