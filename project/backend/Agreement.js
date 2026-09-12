"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAgreement = isAgreement;
exports.isPartialAgreement = isPartialAgreement;
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
        && !!arg.content && arg.content.byteLength > 0
        && arg.applicationid && typeof (arg.applicationid) == 'string'
        && arg.matrNumber && typeof (arg.matrNumber) == 'string'
        && arg.filename && typeof (arg.filename) == 'string'
        && arg.mimetype && typeof (arg.mimetype) == 'string'
        && arg.uploadDate && arg.uploadDate instanceof Date
        && arg.courses && Array.isArray(arg.courses)
        && typeof (arg.modified) == 'boolean';
}
function isPartialAgreement(arg) {
    const hasValidData = arg
        && arg.applicationid && typeof (arg.applicationid) == 'string'
        && arg.matrNumber && typeof (arg.matrNumber) == 'string'
        && arg.uploadDate && arg.uploadDate instanceof Date
        && arg.courses && Array.isArray(arg.courses)
        && typeof (arg.modified) == 'boolean';
    const hasFile = !!arg.content;
    const hasValidFile = !hasFile || (arg.content.byteLength > 0
        && arg.filename && typeof (arg.filename) == 'string'
        && arg.mimetype && typeof (arg.mimetype) == 'string');
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
const CourseSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        required: true
    }
}, { _id: false });
const CourseEvalSchema = new mongoose.Schema({
    originalCourse: {
        type: CourseSchema,
        required: true
    },
    equivalentCourse: {
        type: CourseSchema,
        required: true
    }
});
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
    },
    courses: {
        type: [CourseEvalSchema],
        required: true
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