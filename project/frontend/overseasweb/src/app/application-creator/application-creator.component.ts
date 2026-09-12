import { Component, Inject, OnInit, Input, Output, EventEmitter, signal } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS,FieldGroupResult, FieldGroupEditor, GroupedFieldEditor, dateOptions} from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { Host } from '../host';
import { HostHttpService } from '../host-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSelectChange } from '@angular/material/select';
import { AgreementHttpService } from '../agreement-http.service';

@Component({
  selector: 'app-application-creator',
  templateUrl: './application-creator.component.html',
  styleUrls: ['./application-creator.component.css'],
  standalone: false
})
export class ApplicationCreatorComponent {

  public lecturers: any[] = [];
  public academicYear: string[] = [];
  public semesters: string[] = ['Autumn/Fall', 'Spring','Full Academic Year'];

  public application: Application = {
      _id: '',
      id: '',
      status: 'Created',
      uploadDate: new Date(),
      academicYear: '',
      semester: '',
      matrNumber: '',
      name: '',
      surname: '',
      departement: '',
      sendingInst: '',
      sendingCountry: '',
      hostInst: '',
      hostCountry: '',
      hostCity: '',
      courses: [],
      referent: '',
      agreementApproved: false,
      modified: false,
      lecturerReason: ''
    };
  public hosts: Host[] = [];
  public userRoles : string[] = [];
  public fieldGroupEdited: FieldGroupEditor[] = [];

  constructor( 
    public dialogRef: MatDialogRef<ApplicationCreatorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { application: Application }, 
    private sio: SocketioService , 
    private ap: ApplicationHttpService, 
    public us: UserHttpService, 
    public ho: HostHttpService, 
    private router: Router,  
    private sanitizer: DomSanitizer,
    private ag: AgreementHttpService) 
  { }

  @Output() posted = new EventEmitter<Application>();

  ngOnInit() {
    this.set_empty();
    this.userRoles = this.us.get_roles();
    this.fieldGroupEdited = this.getFieldsByCategoryEditor(this.data.application);
    this.getHost();

    this.us.get_lecturers().subscribe({
      next: (lecturers) => this.lecturers = lecturers,
      error: (err) => console.error(err)
    });
  }

  // Needed to mantain the original order of the object
  originalOrder = (): number => 0;

  // Needed for the accordion on the expansion panel
  readonly panelOpenState = signal(false);

  // Needed for the status color
  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      default:
        return 'status-default';
    }
  }


  getFieldsByCategory(app: Application): FieldGroupResult[] {
      const applicationKeys = Object.keys(app);
      let groups : FieldGroupResult[] = [];
  
      for(const key of applicationKeys) {
        const metaKey = APPLICATION_FIELD_META[key as keyof Application] ;
        if(metaKey === undefined) continue;
        if(!metaKey.hidden) {
          const groupName = FIELD_GROUP_LABELS[metaKey.group];
          const groupsFinded = groups.find(elemento => elemento.groupLabel === groupName);
  
          const rawValue = app[key as keyof Application];
  
          const displayValue = key === 'uploadDate' 
            ? new Date(rawValue as string).toLocaleDateString('en-GB', dateOptions) 
            : (rawValue !== undefined ? rawValue.toString() : '');
  
          if(!groupsFinded) {
            
            groups.push({groupLabel: groupName, fields: [{label: metaKey.label, value: displayValue}]});
          } else {
            groupsFinded.fields.push({label: metaKey.label, value: displayValue});
          }
            
          
        }
      }
  
      return groups;
    }


    // Open a new windows for the learning agreement pdf
  openPdfViewer(applicationId: string) {
    this.ag.get_agreement_by_id(applicationId).subscribe({
      next: (blob: Blob) => {        

        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);

        window.open(blobUrl, '_blank');
      },
      error: (err) => {
        console.error("Errore recupero PDF:", err);
      }
    });
  }

  set_empty(): Application {
    this.application = {
      _id: '',
      id: '',
      status: '',
      uploadDate: new Date(),
      academicYear: '',
      semester: '',
      matrNumber: '',
      name: '',
      surname: '',
      departement: '',
      sendingInst: '',
      sendingCountry: '',
      hostInst: '',
      hostCountry: '',
      hostCity: '',
      courses: [],
      referent: '',
      agreementApproved: false,
      modified: false,
      lecturerReason: ''
    };
    return this.application;
  }

  getFieldsByCategoryEditor(app: Application): FieldGroupEditor[] {

    const applicationsKeys = Object.keys(app);
    let groups : FieldGroupEditor[] = [];

    for(const key of applicationsKeys) {
      
      const metaKey = APPLICATION_FIELD_META[key as keyof Application];
      if(metaKey === undefined) continue;
      if(!metaKey.hidden || metaKey.label === 'Courses') {
        const groupName = FIELD_GROUP_LABELS[metaKey.group];
        const groupsFinded = groups.find(elemento => elemento.groupLabel === groupName);

        // Check if the user can edit the field
        const roles: string[] = this.us.get_roles();
        let editable: boolean = false;
        
        for(const role in roles) {
          if(metaKey.editableFrom.includes(roles[role])) {
            editable = true;
          }
        }      
        if(!groupsFinded) {
          groups.push({groupLabel: groupName, fields: [{key: key as keyof Application, name: metaKey.label, isEditable: editable}]});
        } else {
          groupsFinded.fields.push({key: key as keyof Application, name: metaKey.label, isEditable: editable});
        }
      }
    }

    return groups;
  }

  applicationSubmition() {
    this.data.application.id = this.data.application._id;
    this.ap.post_application_by_matrNumber(this.data.application).subscribe({
      next: () => {
        console.log("Application successfully modified.");
        this.set_empty();
        //this.posted.emit(this.data.application);
        this.dialogRef.close(this.data.application);
      },
      error:(err) => {
        console.log('Error occurred while putting: ' + err);
      }
    });
  }

  addCourseSection(app: Application){
    app.courses.push({
      originalCourse: { code: "", title: "", credits: 0 },
      equivalentCourse: { code: "", title: "", credits: 0 }
    });

  }

  deleteCourseSection(app: Application, courseIndex: number){
    app.courses = app.courses.filter((elemento, index) => index !== courseIndex);
  }

  onHostChange(event: MatSelectChange): void {
    const selectedHost = event.value;
    this.data.application.hostCountry = this.hosts.find(elemento => elemento.name === selectedHost)?.country as string;
    this.data.application.hostCity = this.hosts.find(elemento => elemento.name === selectedHost)?.city as string;
  }

  getHost() {
    this.ho.get_host().subscribe({
      next: (hosts) => {
        console.log("Hosts successfully received.");
        this.hosts = hosts;
      },
      error: (err) => {
        // Hosts not found
        if (err.status === 404) {
        } else {
        }
      }
    });
  }

  calculateAcademicYear(): string[] {
    const date: Date = new Date;
    const actualYear: number = date.getFullYear() - 1;
    const academicYear: string[] = [];
    for(let i = 0; i < 3; i++){
      const actualYearString: string = (actualYear + i).toString();
      const nextYearString: string = (actualYear + i + 1).toString();
      academicYear.push(actualYearString + '-' + nextYearString);
    } 

    return academicYear;

  }

}
