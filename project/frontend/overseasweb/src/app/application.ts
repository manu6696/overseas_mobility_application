
interface Course {
    code: string;
    title: string;
    credits: number;
}

interface CourseEval {
    originalCourse : Course;
    equivalentCourse: Course;
}

export interface Application {
    _id: string;
    id: string;
    status: string;
    uploadDate: Date;
    academicYear: string;
    semester: string;
    matrNumber: string;
    name: string;
    surname: string;
    departement: string;
    sendingInst: string;
    sendingCountry: string;
    hostInst: string;
    hostCountry: string;
    courses: CourseEval[];
    referent: string;
    approved: Boolean;
    modified: Boolean;
    lecturerReason: string;
}

// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Application interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
export function isApplication(arg: any): arg is Application {
    return arg 
    && arg.id && typeof(arg.id) == 'string' 
    && arg.status && typeof(arg.status) == 'string'
    && arg.uploadDate && arg.uploadDate instanceof Date
    && arg.academicYear && typeof(arg.academicYear) == 'string' 
    && arg.semester && typeof(arg.semester) == 'string' 
    && arg.matrNumber && typeof(arg.matrNumber) == 'string' 
    && arg.name && typeof(arg.name) == 'string' 
    && arg.surname && typeof(arg.surname) == 'string' 
    && arg.departement && typeof(arg.departement) == 'string' 
    && arg.sendingInst && typeof(arg.sendingInst) == 'string' 
    && arg.sendingCountry && typeof(arg.sendingCountry) == 'string' 
    && arg.hostInst && typeof(arg.hostInst) == 'string' 
    && arg.hostCountry && typeof(arg.hostCountry) == 'string' 
    && arg.courses && Array.isArray(arg.courses)
    && arg.referent && typeof(arg.referent) == 'string'
    && typeof(arg.approved) == 'boolean'
    && typeof(arg.modified) == 'boolean'
    && typeof(arg.lecturerReason) == 'string'
}

