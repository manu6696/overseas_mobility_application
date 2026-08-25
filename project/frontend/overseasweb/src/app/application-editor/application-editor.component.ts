import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS, FieldGroupEditor, GroupedFieldEditor, dateOptions} from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-application-editor',
  templateUrl: './application-editor.component.html',
  styleUrls: ['./application-editor.component.css'],
  standalone: false
})
export class ApplicationEditorComponent implements OnInit {

  public application: Application | null = null;

  public fieldGroupEdited: FieldGroupEditor[] = [];

  constructor( public dialogRef: MatDialogRef<ApplicationEditorComponent>,@Inject(MAT_DIALOG_DATA) public data: { application: Application }, private sio: SocketioService , private ap: ApplicationHttpService, public us: UserHttpService, private router: Router,  private sanitizer: DomSanitizer) { }

  @Output() posted = new EventEmitter<Application>();
    

  ngOnInit() {
    this.set_empty();

    this.fieldGroupEdited = this.getFieldsByCategoryEditor(this.data.application);
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
      courses: [],
      referent: '',
      approved: false,
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

        if(!groupsFinded) {
          groups.push({groupLabel: groupName, fields: [{key: key as keyof Application, name: metaKey.label}]});
        } else {
          groupsFinded.fields.push({key: key as keyof Application, name: metaKey.label});
        }
      }
    }

    return groups;
  }
  
  ApplicationSaveChanges() {
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
  
  AddCourseSection(app: Application){

    app.courses.push({
      originalCourse: { code: "", title: "", credits: 0 },
      equivalentCourse: { code: "", title: "", credits: 0 }
    });
  }

  DeleteCourseSection(app: Application, courseIndex: number){
    app.courses = app.courses.filter((elemento, index) => index !== courseIndex);
  }



}
