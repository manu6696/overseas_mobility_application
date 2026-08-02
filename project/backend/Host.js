"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHost = isHost;
exports.getSchema = getSchema;
exports.getModel = getModel;
const mongoose = require("mongoose");
// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Application interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
function isHost(arg) {
    return arg
        && arg.name && typeof (arg.name) == 'string'
        && arg.mail && typeof (arg.mail) == 'string'
        && arg.country && typeof (arg.country) == 'string';
}
// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the Application interface with the ApplicationSchema 
//
// Mongoose Schema
let HostSchema = new mongoose.Schema({
    name: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    mail: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    country: {
        type: mongoose.SchemaTypes.String,
        required: true
    }
});
function getSchema() { return HostSchema; }
// Mongoose Model
let HostModel; // This is not exposed outside the model
function getModel() {
    if (!HostModel) {
        HostModel = mongoose.model('Host', getSchema());
    }
    return HostModel;
}
//# sourceMappingURL=Host.js.map