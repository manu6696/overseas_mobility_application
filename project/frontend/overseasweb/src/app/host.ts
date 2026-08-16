
export interface Host {
    _id: string;
    name: string;
    mail: string;
    country: string;
}

// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Message interface anyway)
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

