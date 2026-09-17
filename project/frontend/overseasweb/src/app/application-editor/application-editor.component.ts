import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS, FieldGroupEditor, GroupedFieldEditor, dateOptions} from '../application';
import { Host } from '../host';
import { ApplicationHttpService } from '../application-http.service';
import { HostHttpService } from '../host-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-application-editor',
  templateUrl: './application-editor.component.html',
  styleUrls: ['./application-editor.component.css'],
  standalone: false
})
export class ApplicationEditorComponent implements OnInit {

  public application: Application | null = null;
  public hosts: Host[] = [];
  public userRoles : string[] = [];
  public fieldGroupEdited: FieldGroupEditor[] = [];
  public semesters: string[] = ['Autumn/Fall', 'Spring','Full Academic Year'];
  public lecturers: any[] = [];
  @Output() posted = new EventEmitter<Application>();

  constructor( 
    public dialogRef: MatDialogRef<ApplicationEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      application: Application 
    }, 
    private sio: SocketioService , 
    private ap: ApplicationHttpService, 
    public us: UserHttpService, 
    public ho: HostHttpService, 
    private router: Router,  
    private sanitizer: DomSanitizer) 
  { }
    

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
      if((!metaKey.hidden || metaKey.label === 'Courses') && metaKey.label !== 'Upload Date' && metaKey.label !== 'Arrival Date' && metaKey.label !== 'Departure Date') {
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
  
  applicationSaveChanges() {
    this.data.application.id = this.data.application._id;
    this.ap.put_application_by_id(this.data.application).subscribe({
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
      originalCourse: { code: "", title: "", credits: '' },
      equivalentCourse: { code: "", title: "", credits: '' }
    });

  }

  deleteCourseSection(app: Application, courseIndex: number){
    app.courses = app.courses.filter((elemento, index) => index !== courseIndex);
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
          this.application = null;
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


  onHostChange(event: MatSelectChange): void {
    const selectedHost = event.value;
    this.data.application.hostCountry = this.hosts.find(elemento => elemento.name === selectedHost)?.country as string;
    this.data.application.hostCity = this.hosts.find(elemento => elemento.name === selectedHost)?.city as string;
  }



  canEditCourses(){
    return (this.application?.status === 'Mobility in progress' || this.application?.status === 'Created');
  }




}
