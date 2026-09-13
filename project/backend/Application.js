"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isApplication = isApplication;
exports.isPartialApplication = isPartialApplication;
exports.getSchema = getSchema;
exports.getModel = getModel;
const mongoose = require("mongoose");
// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Application interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
function isApplication(arg) {
    return arg
        && arg.status && typeof (arg.status) == 'string'
        && arg.uploadDate && arg.uploadDate instanceof Date
        && arg.academicYear && typeof (arg.academicYear) == 'string'
        && arg.semester && typeof (arg.semester) == 'string'
        && arg.matrNumber && typeof (arg.matrNumber) == 'string'
        && arg.name && typeof (arg.name) == 'string'
        && arg.surname && typeof (arg.surname) == 'string'
        && arg.departement && typeof (arg.departement) == 'string'
        && arg.sendingInst && typeof (arg.sendingInst) == 'string'
        && arg.sendingCountry && typeof (arg.sendingCountry) == 'string'
        && arg.hostInst && typeof (arg.hostInst) == 'string'
        && arg.hostCountry && typeof (arg.hostCountry) == 'string'
        && arg.hostCity && typeof (arg.hostCity) == 'string'
        && arg.courses && Array.isArray(arg.courses)
        && arg.referent && typeof (arg.referent) == 'string'
        && typeof (arg.agreementApproved) == 'boolean'
        && typeof (arg.modified) == 'boolean'
        && typeof (arg.lecturerReason) == 'string';
}
function isPartialApplication(arg) {
    const hasValidData = arg
        && arg.matrNumber && typeof (arg.matrNumber) == 'string'
        && arg.referent && typeof (arg.referent) == 'string';
    const stringFieldsIfPresent = ['status', 'academicYear', 'semester', 'name', 'surname',
        'departement', 'sendingInst', 'sendingCountry', 'hostInst', 'hostCountry', 'hostCity',
        'lecturerReason'].every(field => arg[field] === undefined || typeof (arg[field]) == 'string');
    const coursesOk = arg.courses === undefined || Array.isArray(arg.courses);
    const approvedOk = arg.approved === undefined || typeof (arg.approved) == 'boolean';
    const agreementApprovedOk = arg.agreementApproved === undefined || typeof (arg.agreementApproved) == 'boolean';
    const modifiedOk = arg.modified === undefined || typeof (arg.modified) == 'boolean';
    const preDepartureOk = arg.preDepartureCompleted === undefined || typeof (arg.preDepartureCompleted) == 'boolean';
    return hasValidData && stringFieldsIfPresent && coursesOk && approvedOk && agreementApprovedOk && modifiedOk && preDepartureOk;
}
// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the Application interface with the ApplicationSchema 
//
// Mongoose Schema
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
let ApplicationSchema = new mongoose.Schema({
    /*
    _id: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    */
    status: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    uploadDate: {
        type: mongoose.SchemaTypes.Date,
        required: true
    },
    academicYear: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    semester: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    matrNumber: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    name: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    surname: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    departement: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    sendingInst: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    sendingCountry: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    hostInst: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    hostCountry: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    hostCity: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    courses: {
        type: [CourseEvalSchema],
        required: true
    },
    referent: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    agreementApproved: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    modified: {
        type: mongoose.SchemaTypes.Boolean,
        required: true
    },
    lecturerReason: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    preDepartureCompleted: {
        type: mongoose.SchemaTypes.Boolean,
        required: false
    },
    recordsUploaded: {
        type: mongoose.SchemaTypes.Boolean,
        required: false
    },
    arrivalDate: {
        type: mongoose.SchemaTypes.Date,
        required: false
    },
    departureDate: {
        type: mongoose.SchemaTypes.Date,
        required: false
    }
});
function getSchema() { return ApplicationSchema; }
// Mongoose Model
let ApplicationModel; // This is not exposed outside the model
function getModel() {
    if (!ApplicationModel) {
        ApplicationModel = mongoose.model('Application', getSchema());
    }
    return ApplicationModel;
}
//# sourceMappingURL=Application.js.map