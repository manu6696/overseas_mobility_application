

interface CourseResult {
  code: string;
  grade: string;
  approved: string;
}

export interface TranscriptRecord {
    _id?: string;
    records: CourseResult[];
    uploadDate: Date;
    applicationid: string;
    matrNumber: string;
}

// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Message interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
export function isTranscriptRecord(arg: any): arg is TranscriptRecord {
    return arg 
    && arg.applicationid && typeof(arg.applicationid) == 'string'
    && arg.matrNumber && typeof(arg.matrNumber) == 'string' 
    && arg.records && Array.isArray(arg.records) 
    && arg.uploadDate && arg.uploadDate instanceof Date;
}


