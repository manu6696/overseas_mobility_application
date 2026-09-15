
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
    _id?: string;
    id?: string;
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
    hostCity: string;
    courses: CourseEval[];
    referent: string;
    agreementApproved: boolean;
    modified: boolean;
    lecturerReason: string;
    preDepartureCompleted?: boolean;
    recordsUploaded?: boolean;
    arrivalDate?: Date;
    departureDate?: Date;
}

// User defined type guard
// Type checking cannot be performed during the execution (we don't have the Application interface anyway)
// but we can create a function to check if the supplied parameter is compatible with a given type
//
// A better approach is to use JSON schema
//
export function isApplication(arg: any): arg is Application {
    return arg 
    && arg.status && typeof(arg.status) == 'string'
    && arg.uploadDate && typeof(arg.uploadDate) == 'string' 
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
    && arg.hostCity && typeof(arg.hostCity) == 'string' 
    && arg.courses && Array.isArray(arg.courses)
    && arg.referent && typeof(arg.referent) == 'string'
    && typeof(arg.agreementApproved) == 'boolean'
    && typeof(arg.modified) == 'boolean'
    && typeof(arg.lecturerReason) == 'string'
    
}



// HTML group visualization

interface FieldMeta {
  label: string;
  group: FieldGroup;
  hidden?: boolean;
  editableFrom: string[];
}


export type FieldGroup = 'student'| 'general'| 'sendingInst'| 'hostingInst'| 'lecturer'| 'system' | 'courses' | 'mobilityDate';
export const GROUP_ORDER: FieldGroup[] = ['general', 'mobilityDate', 'student', 'sendingInst', 'hostingInst', 'lecturer', 'courses', 'system'];

export const APPLICATION_FIELD_META : Record<keyof Application, FieldMeta> = {

    // System group
    _id : {
        label: 'ID', 
        group: 'system', 
        hidden: true,
        editableFrom: []
    },

    id : {
        label: 'ID', 
        group: 'system', 
        hidden: true,
        editableFrom: []
    },

    // General group
    status : {
        label: 'Status', 
        group: 'general', 
        hidden: true, 
        editableFrom: ['ADMIN', 'MODERATOR', 'LECTURER', 'STAFF']
    },

    uploadDate : {
        label: 'Upload Date', 
        group: 'general', 
        hidden: false, 
        editableFrom: []
    },
    
    academicYear : {
        label: 'Academic Year', 
        group: 'general', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },
    
    semester : {
        label: 'Semester', 
        group: 'general', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },

    // Student group
    matrNumber : {
        label: 'Matriculation Number', 
        group: 'student', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'LECTURER', 'STAFF']
    },
    
    name : {
        label: 'Name', 
        group: 'student', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'LECTURER', 'STAFF']
    },
    
    surname : {
        label: 'Surname', 
        group: 'student', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'LECTURER', 'STAFF']
    },

    arrivalDate : {
        label: 'Arrival Date', 
        group: 'mobilityDate', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },

    departureDate : {
        label: 'Departure Date', 
        group: 'mobilityDate', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },

    // Sending institution
    departement : {
        label: 'Departement', 
        group: 'sendingInst', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },
    
    sendingInst : {
        label: 'Sending Institution', 
        group: 'sendingInst', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },
    
    sendingCountry : {
        label: 'Sending Country', 
        group: 'sendingInst', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },

    // Hosting institution
    hostInst : {
        label: 'Hosting Institution', 
        group: 'hostingInst', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },
    
    hostCountry : {
        label: 'Hosting Country', 
        group: 'hostingInst', 
        hidden: false, 
        editableFrom: []
    },

    hostCity : {
        label: 'Hosting City', 
        group: 'hostingInst', 
        hidden: false, 
        editableFrom: []
    },

    // Courses
    courses : {
        label: 'Courses', 
        group: 'courses', 
        hidden: true, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },

    // Lecturer
    referent : {
        label: 'Referent Name', 
        group: 'lecturer', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STUDENT', 'LECTURER', 'STAFF']
    },
    
    lecturerReason : {
        label: 'Lecturer Reason', 
        group: 'lecturer', 
        hidden: false, 
        editableFrom: ['ADMIN', 'MODERATOR', 'LECTURER', 'STAFF']
    },
    
    agreementApproved : {
        label: 'Agreement approved', 
        group: 'lecturer', 
        hidden: true, 
        editableFrom: ['ADMIN', 'MODERATOR', 'LECTURER', 'STAFF']
    },
    
    modified : {
        label: 'Modified', 
        group: 'lecturer', 
        hidden: true, 
        editableFrom: []
    },

    preDepartureCompleted : {
        label: 'Pre-departure Completed', 
        group: 'general', 
        hidden: true, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STAFF']
    },
    recordsUploaded : {
        label: 'Transcript of Records uploaded', 
        group: 'general', 
        hidden: true, 
        editableFrom: ['ADMIN', 'MODERATOR', 'STAFF']
    }
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
    'mobilityDate': 'Mobility Date',
    'sendingInst': 'Sending Institution',
    'hostingInst': 'Hosting Institution',
    'lecturer': 'Lecturer',
    'system' : 'System',
    'courses' : 'Courses'
};


export interface GroupedFieldEditor {
    key: keyof Application;
    name: string;
    isEditable: boolean;
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















