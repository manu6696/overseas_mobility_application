
import mongoose = require('mongoose');



export interface Host extends mongoose.Document {
    name: string,
    mail: string,
    country: string
}


// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Application interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
export function isHost(arg: any): arg is Host {
    return arg 
    && arg.name && typeof(arg.name) == 'string' 
    && arg.mail && typeof(arg.mail) == 'string' 
    && arg.country && typeof(arg.country) == 'string'
}


// We use Mongoose to perform the ODM between our application and
// mongodb. To do that we need to create a Schema and an associated
// data model that will be mapped into a mongodb collection
//
// Type checking cannot be enforced at runtime so we must take care
// of correctly matching the Application interface with the ApplicationSchema 
//
// Mongoose Schema

let HostSchema = new mongoose.Schema<Host>( {
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
    country:  {
        type: mongoose.SchemaTypes.String,
        required: true 
    }
})

export function getSchema() { return HostSchema; }

// Mongoose Model
let HostModel:mongoose.Model<Host>|undefined;  // This is not exposed outside the model


export function getModel() : mongoose.Model< Host >  { // Return Model as singleton
    if( !HostModel ) {
        HostModel = mongoose.model('Host', getSchema() )
    }
    return HostModel;
}
