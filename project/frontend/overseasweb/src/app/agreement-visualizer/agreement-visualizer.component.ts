import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS, FieldGroupEditor, GroupedFieldEditor, dateOptions, CourseEval} from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { Host } from '../host';
import { HostHttpService } from '../host-http.service';
import { UserHttpService } from '../user-http.service';
import { AgreementHttpService } from '../agreement-http.service';
import { Agreement } from '../agreement';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-agreement-visualizer',
  templateUrl: './agreement-visualizer.component.html',
  styleUrls: ['./agreement-visualizer.component.css'],
  standalone: false
})
export class AgreementVisualizerComponent implements OnInit {

  public application: Application | null = null;
  public agreements: Agreement[] = [];
  public agreementsApproved: boolean[] = [];
  public isLecturer: boolean = false;
  public isStudent: boolean = false;
  public fieldGroupEdited: FieldGroupEditor[] = [];
  public newModifyDescription: string = "";
  public newAgreement : Agreement | null = null;
  public selectedFile : File | null = null;
  public agreementState: string[] = ['Pending', 'Approved','Rejected'];
  public courses: CourseEval[] = [];
  @Output() posted = new EventEmitter<Application>();

  
  constructor( 
    public dialogRef: MatDialogRef<AgreementVisualizerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { application: Application }, 
    private sio: SocketioService , 
    private ap: ApplicationHttpService, 
    public us: UserHttpService, 
    public ho: HostHttpService, 
    private router: Router,  
    private ag: AgreementHttpService,
    private sanitizer: DomSanitizer) { }
    private applicationCourses: CourseEval[] = [];


  ngOnInit() {
    this.isLecturer = this.us.is_lecturer();
    this.isStudent = this.us.is_student();
    this.fieldGroupEdited = this.getFieldsByCategoryEditor(this.data.application);
    this.get_agreement_list_by_query(this.data.application._id!);
    this.sio.connect().subscribe((m) => {
      this.get_agreement_list_by_query(this.data.application._id!);
    });
    this.applicationCourses = this.data.application.courses;
    this.courses = this.data.application.courses;
  }


  public get_agreement_list_by_query(applicationid : string){

    
    this.ag.get_agreement_list_no_content_by_query({applicationid}).subscribe( {
      next: (agreements) => {
        console.log("Agreement successfully received.");
        this.agreements = agreements;
        this.agreementsApproved = this.agreements.map((elemento) => elemento.approved === 'Approved');
      },
      error: (err) => {
        // Agreement not found
          this.agreements = [];
      }
    });

  }



  getFieldsByCategoryEditor(app: Application): FieldGroupEditor[] {

    const applicationsKeys = Object.keys(app);
    let groups : FieldGroupEditor[] = [];

    for(const key of applicationsKeys) {
      
      const metaKey = APPLICATION_FIELD_META[key as keyof Application];
      if(metaKey === undefined) continue;
      if((!metaKey.hidden || metaKey.label === 'Courses') && metaKey.label !== 'Upload Date') {
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


  // Open a new windows for the learning agreement pdf
  openPdfViewer(agreementId: string) {
    console.log("Agreement id Is: " + agreementId);
    this.ag.get_agreement_by_id(agreementId).subscribe({
      next: (blob: Blob) => {        

        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);

        window.open(blobUrl, '_blank');
      },
      error: (err) => {
        console.error("Error retrieving PDF:", err);
      }
    });
  }

  // Selecting the file
  onFileSelected(evento: Event) {
    let inputElement = evento.target as HTMLInputElement;
    let file = inputElement.files?.item(0);

    if(file && file.type === 'application/pdf') {
      this.selectedFile = file;

    } else {
      console.log("Error: file is not a pdf");
    }
  }

  // Saving agreement (needed by student)
  onAgreementSave() {
    const formData = new FormData();
    const date = new Date;

    if (this.selectedFile) {
      formData.append('agreement', this.selectedFile);
    }
    formData.append('matrNumber', this.data.application.matrNumber);
    formData.append('modifyDescription', this.newModifyDescription);
    formData.append('applicationid', this.data.application._id!);
    formData.append('courses', JSON.stringify(this.courses));
    
    this.ag.post_agreement(formData, this.data.application._id!).subscribe({
      next: () => {
        this.get_agreement_list_by_query(this.data.application._id!);
        this.newModifyDescription = '';
        this.dialogRef.close(this.data.application);
      },
      error: (err) => {
        console.error("Error saving PDF:", err);
      }
    });

    this.posted.emit(this.data.application);
  }

  // Updating agreement (needed by lecturers)
  onAgreementUpdate(agreement: Agreement) {

    this.ag.put_agreement(agreement).subscribe({
      next: () => {

        this.get_agreement_list_by_query(this.data.application._id!);
        
        if(this.isLecturer) {
          this.ap.get_application_by_query({referent: this.us.get_username()}).subscribe({
            next: (application) => {
              this.data.application = application.find((elemento) => elemento._id === this.data.application._id)!;
              this.dialogRef.close(this.data.application);
            },
            error: (err) => {
              console.log("Error getting application:",err);
            }
          });
        }

        if(this.isStudent) {
          this.ap.get_application_by_matrNumber(this.us.get_username()).subscribe({
            next: (application) => {
              this.data.application = application.find((elemento) => elemento._id === this.data.application._id)!;
              this.dialogRef.close(this.data.application);
            },
            error: (err) => {
              console.log("Error getting application:",err);
            }
          });
        }

      },
      error: (err) => {
        console.error("Error updating agreement:", err);
      }
    });


  }

  userIsLecturer() {
    return this.isLecturer;
  }

  userIsStudent() {
    return this.isStudent;
  }

  addCourseSection(ag: Agreement){
    ag.courses.push({
      originalCourse: { code: "", title: "", credits: 0 },
      equivalentCourse: { code: "", title: "", credits: 0 }
    });

  }

  deleteCourseSection(ag: Agreement, courseIndex: number){
    ag.courses = ag.courses.filter((elemento, index) => index !== courseIndex);
  }

  // For visualize the agreement's edit section
  agreementIsEditable() {
    const notClosed = this.data.application.status !== 'Closed';
    const notCanceled = this.data.application.status !== 'Canceled'
    const notAwaitingScoreAppr = this.data.application.status !== 'Waiting for exam score approval'
    const notAwaitingLAAppr = this.data.application.status !== 'Awaiting Agreement approval'
    return notClosed && notCanceled && notAwaitingScoreAppr && notAwaitingLAAppr;
  }
}
