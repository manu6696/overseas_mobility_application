
import mongoose = require('mongoose');
import crypto = require('crypto');



export interface Host extends mongoose.Document {
    Hostname: string,
    mail: string,
    roles: string[],
    salt: string,    // salt is a random string that will be mixed with the actual password before hashing
    digest: string,  // this is the hashed password (digest of the password)
    setPassword: (pwd:string)=>void,
    validatePassword: (pwd:string)=>boolean,
    hasAdminRole: ()=>boolean,
    setAdmin: ()=>void,
    hasModeratorRole: ()=>boolean,
    setModerator: ()=>void,
}

const HostSchema = new mongoose.Schema<Host>( {
    Hostname: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    mail: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    roles:  {
        type: [mongoose.SchemaTypes.String],
        required: true 
    },
    salt:  {
        type: mongoose.SchemaTypes.String,
        required: false 
    },
    digest:  {
        type: mongoose.SchemaTypes.String,
        required: false 
    }
})

// Here we add some methods to the Host Schema

HostSchema.methods.setPassword = function( pwd:string ) {

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
    const hmac = crypto.createHmac('sha512', this.salt );
    hmac.update( pwd );
    this.digest = hmac.digest('hex'); // The final digest depends both by the password and the salt
}

HostSchema.methods.validatePassword = function( pwd:string ):boolean {

    // To validate the password, we compute the digest with the
    // same HMAC to check if it matches with the digest we stored
    // in the database.
    //
    const hmac = crypto.createHmac('sha512', this.salt );
    hmac.update(pwd);
    const digest = hmac.digest('hex');
    return (this.digest === digest);
}

HostSchema.methods.setAdmin = function() {
    if( !this.hasAdminRole() )
        this.roles.push( "ADMIN" );
}


HostSchema.methods.setModerator = function() {
    if( !this.hasModeratorRole() )
        this.roles.push( "MODERATOR" );
}

HostSchema.methods.hasAdminRole = function(): boolean {
    return this.roles.includes("ADMIN");
}

HostSchema.methods.hasModeratorRole = function(): boolean {
    return this.roles.includes("MODERATOR");
}




export function getSchema() { return HostSchema; }

// Mongoose Model
let HostModel:mongoose.Model<Host>|undefined;  // This is not exposed outside the model


export function getModel() : mongoose.Model< Host >  { // Return Model as singleton
    if( !HostModel ) {
        HostModel = mongoose.model('Host', getSchema() )
    }
    return HostModel;
}

export function newHost( data:{Hostname:string;mail:string} ): Host {
    let _Hostmodel = getModel();
    let Host = new _Hostmodel( data );
    return Host;
}