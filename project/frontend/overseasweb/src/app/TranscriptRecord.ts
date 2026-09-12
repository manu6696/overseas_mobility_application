
import { ApprovalStatus } from "./agreement";

export interface CourseResult {
  code: string;
  grade: string;
  examDate: Date;
  approved: ApprovalStatus;
}

export interface TranscriptRecord {
    _id?: string;
    filename: string;
    content?: any;
    mimetype: string;
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
    && arg.content && arg.content.byteLength > 0
    && arg.filename && typeof(arg.filename) == 'string'
    && arg.mimetype && typeof(arg.mimetype) == 'string'
    && arg.applicationid && typeof(arg.applicationid) == 'string'
    && arg.matrNumber && typeof(arg.matrNumber) == 'string' 
    && arg.records && Array.isArray(arg.records) 
    && arg.uploadDate && arg.uploadDate instanceof Date;
}
