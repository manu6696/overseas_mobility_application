
export interface Agreement {
    _id: string;
    filename: string;
    content: any;
    mimetype: string;
    uploadDate: Date;
    applicationid: string;
    matrNumber: string;
    approved: boolean;
    modified: boolean;
    lecturerReason: string;
}

// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Application interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
export function isAgreement(arg: any): arg is Agreement {
    return arg 
    && arg.content.byteLength > 0
    && arg.applicationid && typeof(arg.applicationid) == 'string'
    && arg.matrNumber && typeof(arg.matrNumber) == 'string' 
    && arg.filename && typeof(arg.filename) == 'string' 
    && arg.mimetype && typeof(arg.mimetype) == 'string'
    && arg.uploadDate && arg.uploadDate instanceof Date
    && typeof(arg.approved) == 'boolean'
    && typeof(arg.modified) == 'boolean'
    && typeof(arg.lecturerReason) == 'string'
}

