"use strict";
exports.__esModule = true;
exports.newHost = exports.getModel = exports.getSchema = void 0;
var mongoose = require("mongoose");
var crypto = require("crypto");
var HostSchema = new mongoose.Schema({
    Hostname: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    mail: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    roles: {
        type: [mongoose.SchemaTypes.String],
        required: true
    },
    salt: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    digest: {
        type: mongoose.SchemaTypes.String,
        required: false
    }
});
// Here we add some methods to the Host Schema
HostSchema.methods.setPassword = function (pwd) {
    this.salt = crypto.randomBytes(16).toString('hex'); // We use a random 16-bytes hex string for salt
    // We use the hash function sha512 to hash both the password and salt to
    // obtain a password digest 
    // 
    // From wikipedia: (https://en.wikipedia.org/wiki/HMAC)
    // In cryptography, an HMAC (sometimes disabbreviated as either keyed-hash message 
    // authentication code or hash-based message authentication code) is a specific type 
    // of message authentication code (MAC) involving a cryptographic hash function and 
    // a secret cryptographic key.
    //
    var hmac = crypto.createHmac('sha512', this.salt);
    hmac.update(pwd);
    this.digest = hmac.digest('hex'); // The final digest depends both by the password and the salt
};
HostSchema.methods.validatePassword = function (pwd) {
    // To validate the password, we compute the digest with the
    // same HMAC to check if it matches with the digest we stored
    // in the database.
    //
    var hmac = crypto.createHmac('sha512', this.salt);
    hmac.update(pwd);
    var digest = hmac.digest('hex');
    return (this.digest === digest);
};
HostSchema.methods.setAdmin = function () {
    if (!this.hasAdminRole())
        this.roles.push("ADMIN");
};
HostSchema.methods.setModerator = function () {
    if (!this.hasModeratorRole())
        this.roles.push("MODERATOR");
};
HostSchema.methods.hasAdminRole = function () {
    return this.roles.includes("ADMIN");
};
HostSchema.methods.hasModeratorRole = function () {
    return this.roles.includes("MODERATOR");
};
function getSchema() { return HostSchema; }
exports.getSchema = getSchema;
// Mongoose Model
var HostModel; // This is not exposed outside the model
function getModel() {
    if (!HostModel) {
        HostModel = mongoose.model('Host', getSchema());
    }
    return HostModel;
}
exports.getModel = getModel;
function newHost(data) {
    var _Hostmodel = getModel();
    var Host = new _Hostmodel(data);
    return Host;
}
exports.newHost = newHost;
