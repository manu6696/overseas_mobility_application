
export interface Course {    
    code: string;
    title: string;
    credits: number;
}

export interface CourseEval {
    _id?: string;
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



// HTML group visualization

interface FieldMeta {
  label: string;
  group: FieldGroup;
  hidden?: boolean;
  editableFromStudent: boolean;
  editableFromLecturer: boolean;
  editableFromStaff: boolean;
}


 export type FieldGroup = 'student'| 'general'| 'sendingInst'| 'hostingInst'| 'lecturer'| 'system' | 'courses';

export const APPLICATION_FIELD_META : Record<keyof Application, FieldMeta> = {

    // System group
    _id : {
        label: 'ID', 
        group: 'system', 
        hidden: true,
        editableFromStudent: false, 
        editableFromLecturer: false, 
        editableFromStaff: false},

    id : {
        label: 'ID', 
        group: 'system', 
        hidden: true,
        editableFromStudent: false, 
        editableFromLecturer: false, 
        editableFromStaff: false},

    // General group
    status : {
        label: 'Status', 
        group: 'general', 
        hidden: true, 
        editableFromStudent: false, 
        editableFromLecturer: false, 
        editableFromStaff: true},

    uploadDate : {
        label: 'Upload Date', 
        group: 'general', 
        hidden: false, 
        editableFromStudent: false, 
        editableFromLecturer: false, 
        editableFromStaff: true},
    
    academicYear : {
        label: 'Academic Year', 
        group: 'general', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    semester : {
        label: 'Semester', 
        group: 'general', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},

    // Student group
    matrNumber : {
        label: 'Matriculation Number', 
        group: 'student', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    name : {
        label: 'Name', 
        group: 'student', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    surname : {
        label: 'Surname', 
        group: 'student', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},

    // Sending institution
    departement : {
        label: 'Departement', 
        group: 'sendingInst', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    sendingInst : {
        label: 'Sending Institution', 
        group: 'sendingInst', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    sendingCountry : {
        label: 'Sending Country', 
        group: 'sendingInst', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},

    // Hosting institution
    hostInst : {
        label: 'Hosting Institution', 
        group: 'hostingInst', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    hostCountry : {
        label: 'Hosting Country', 
        group: 'hostingInst', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},

    // Courses
    courses : {
        label: 'Courses', 
        group: 'courses', 
        hidden: true, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},

    // Lecturer
    referent : {
        label: 'Referent Name', 
        group: 'lecturer', 
        hidden: false, 
        editableFromStudent: true, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    lecturerReason : {
        label: 'Lecturer Reason', 
        group: 'lecturer', 
        hidden: false, 
        editableFromStudent: false, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    approved : {
        label: 'Approved', 
        group: 'lecturer', 
        hidden: true, 
        editableFromStudent: false, 
        editableFromLecturer: true, 
        editableFromStaff: true},
    
    modified : {
        label: 'Modified', 
        group: 'lecturer', 
        hidden: true, 
        editableFromStudent: false, 
        editableFromLecturer: false, 
        editableFromStaff: false}
}


export interface GroupedField {
    label: string;
    value: string;
}

export interface FieldGroupResult {
    groupLabel: string;
    fields: GroupedField[]
}

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = { 
    'student' : 'Student',
    'general': 'General',
    'sendingInst': 'Sending Institution',
    'hostingInst': 'Hosting Institution',
    'lecturer': 'Lecturer',
    'system' : 'System',
    'courses' : 'Courses'
};


export interface GroupedFieldEditor {
    key: keyof Application;
    name: string;
}


export interface FieldGroupEditor {
    groupLabel: string;
    fields: GroupedFieldEditor[]
}


export const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false
} as const ;















