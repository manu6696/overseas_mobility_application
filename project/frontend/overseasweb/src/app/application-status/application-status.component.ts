import { Component, OnInit, signal, TemplateRef, Input, Output, EventEmitter, model, OnChanges, SimpleChanges } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FieldGroupResult,GROUP_ORDER,FieldGroupEditor, FieldGroup, GroupedField, FIELD_GROUP_LABELS, dateOptions, CourseEval, isApplication } from '../application';
import { TranscriptRecord } from '../transcriptRecord';
import { ApplicationHttpService } from '../application-http.service';
import { UserHttpService } from '../user-http.service';
import { TranscriptRecordHttpService } from '../transcript-record-http.service';
import { AgreementHttpService } from '../agreement-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApplicationEditorComponent } from '../application-editor/application-editor.component';
import { RecordsVisualizerComponent } from '../records-visualizer/records-visualizer.component';
import { AgreementVisualizerComponent } from '../agreement-visualizer/agreement-visualizer.component';

@Component({
  selector: 'app-application-status',
  templateUrl: './application-status.component.html',
  styleUrls: ['./application-status.component.css'],
  standalone: false
})
export class ApplicationStatusComponent implements OnInit, OnChanges {

  @Input() application: Application | null = null;
  @Output() applicationDeleted = new EventEmitter<string>();
  @Output() applicationModified = new EventEmitter<string>();
  public fieldGroupEdited: FieldGroupEditor[] = [];
  clonedCourses: CourseEval[] = [];
  public openConfirmDialog: boolean = false;
  public dialogConfirmDeletion: any;
  public dialogApplicationPhase: any;
  public transcriptRecords: TranscriptRecord | null = null;
  public isLecturer: boolean = false;
  public isStaff: boolean = false;
  public isStudent: boolean = false;
  public arrivalDateSelected: Date = new Date;
  public departureDateSelected: Date = new Date;
  public preDepartureCompleted: boolean = false;
  public applicationClosed: boolean = false;
  public canVerifyPreDeparture: boolean = false;
  public recordsUploaded: boolean = false;

  constructor( 
    private sio: SocketioService , 
    public ap: ApplicationHttpService, 
    public us: UserHttpService, 
    private router: Router, 
    private dialog: MatDialog, 
    private sanitizer: DomSanitizer, 
    private ag: AgreementHttpService,
    private rec: TranscriptRecordHttpService) 
    { }
  
  ngOnInit() {
    this.isLecturer = this.us.is_lecturer();
    this.isStaff = this.us.is_staff();
    this.isStudent = this.us.is_student();
    this.copyOfCourses();    
    this.openConfirmDialog = false;
    this.arrivalDateSelected = this.application?.arrivalDate? new Date(this.application.arrivalDate): new Date();
    this.departureDateSelected = this.application?.departureDate? new Date(this.application.departureDate): new Date();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['application']) {
      this.canVerifyPreDeparture = !!this.application?.agreementApproved && isApplication(this.application);
      this.recordsUploaded = !!this.application?.recordsUploaded;
    }
  }

  // Needed to mantain the original order of the object
  originalOrder = (): number => 0;

  // Needed for the accordion on the expansion panel
  readonly panelOpenState = signal(false);

  // Needed for the status color
  // Created
  // Awaiting Learning Agreement approval
  // Pre-departure completed
  // Mobility in progress
  // Waiting for exam score approval
  // Closed
  // Canceled
  getStatusClass(status: string): string {
    switch (status) {
      case 'Created':
        return 'status-default';
      case 'Awaiting Agreement approval':
        return 'status-agreement-approval';
      case 'Pre-departure completed':
        return 'status-predeparture';
      case 'Mobility in progress':
        return 'status-mobility';
      case 'Waiting for exam score approval':
        return 'status-score-approval';
      case 'Closed':
        return 'status-closed';
      case 'Canceled':
        return 'status-canceled';
      default:
        return 'status-default';
    }
  }

  // Used to help the process
 getHintMessage(): string{
    switch(this.application?.status) {
      case 'Created':
        return 'Waiting for Learning Agreement';
      case 'Awaiting Agreement approval':
        if(!this.application.agreementApproved)
          return 'Waiting for lecturer approval';
        else
          return 'Waiting for staff approval';
      case 'Pre-departure completed':
        return 'Automatic changing phase';
      case 'Mobility in progress':
        return 'Waiting for exam score';
      case 'Waiting for exam score approval':
        if(!this.application.recordsUploaded)
          return 'Waiting for lecturer approval';
        else 
          return 'Waiting for application closing by staff';
      default:
        return '';
    }
  }



  // Needed to hide some fields
  private hiddenFields = ['_id', '__v', 'modified', 'status', 'approved', 'courses'];

  isVisibleField(key: string): boolean {
    return !this.hiddenFields.includes(key);
  }

  // Needed to organize the fields
  private generalData = ['uploadDate', 'academicYear', 'semester'];
  private studentData = ['matrNumber', 'name', 'surname'];
  private sendingInstData = ['departement', 'sendingInst', 'sendingCountry'];
  private hostingInstData = ['hostInst', 'hostCountry'];
  private lecturerData = ['referent', 'lecturerReason'];

  isGeneralData(key: string): boolean {
    return !this.generalData.includes(key);
  }

  isStudentData(key: string): boolean {
    return !this.studentData.includes(key);
  }

  isSendingInstData(key: string): boolean {
    return !this.sendingInstData.includes(key);
  }

  isHostingInstData(key: string): boolean {
    return !this.hostingInstData.includes(key);
  }

  isLecturerData(key: string): boolean {
    return !this.lecturerData.includes(key);
  }

  // Deleting application
  public delete_application_by_id(id : string) {
    this.ap.delete_application_by_id(id).subscribe( {
      next: () => {
        console.log("Application successfully deleted.");
        
        this.application = null;
        
      },
      error: (err) => {
        // Application not found
        if (err.status === 404) {
        } else {
          // In other case the system will logout
          // this.logout();
        }
      }
    });
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/']);
  }


  // Needed to manage the group of each field of the application (principally used for visualization)
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

        const displayValue = (key === 'uploadDate') ||  (key === 'arrivalDate') || (key === 'departureDate')
          ? new Date(rawValue as string).toLocaleDateString('en-GB', dateOptions) 
          : (rawValue !== undefined ? rawValue.toString() : '');

        if(!groupsFinded) {
          
          groups.push({groupLabel: groupName, fields: [{label: metaKey.label, value: displayValue}]});
        } else {
          groupsFinded.fields.push({label: metaKey.label, value: displayValue});
        }
      }
    }
    groups.sort((a, b) => {
      const labelOrder = GROUP_ORDER.map(g => FIELD_GROUP_LABELS[g]);
      return labelOrder.indexOf(a.groupLabel) - labelOrder.indexOf(b.groupLabel);
    });

    return groups;
  }



  // Open the editor needed to modify the application data
  openApplicationEditor() {
    const dialogRef = this.dialog.open(ApplicationEditorComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '85vh',    
      data: {application: {...this.application}}
    });
      
    dialogRef.afterClosed().subscribe((updatedApplication: Application) => {
      if (updatedApplication) {
        console.log('Dati ricevuti dal dialog:', updatedApplication);
       
        this.applicationModified.emit(updatedApplication._id);
        this.clonedCourses = updatedApplication.courses;
      }
    });
  }

  // Open the delete dialog
  openDeleteDialog(templateRef: TemplateRef<any>) {
    this.dialogConfirmDeletion = this.dialog.open(templateRef,{
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '85vh'
    });

    this.dialogConfirmDeletion .afterClosed().subscribe((updatedApplication: Application) => {
      if (updatedApplication) {
        console.log('Dati ricevuti dal dialog:', updatedApplication);
        
        this.applicationModified.emit(updatedApplication._id);
        this.clonedCourses = updatedApplication.courses;
      }
    });
  }

      
  // Delete the application permanentely
  confirmDelete(id: string) {
    if (!id) {
      console.log("Invalid id");
      return;
    }

    this.ap.delete_application_by_id(id).subscribe({
      next: () => {
        this.applicationDeleted.emit(id);
        this.dialogConfirmDeletion.close();
      },
      error: (err) => console.error("Errore durante l'eliminazione:", err)
    });
  }

  
  // Open the editor needed to modify the transcript of records
  openRecordsDialog() {
    if(this.application?._id) {
      this.rec.get_transcript_by_id(this.application._id).subscribe({
        next: (transcriptRecords) => {
          console.log("Transcript of records successfully received.");
          this.transcriptRecords = transcriptRecords;

          const dialogRef = this.dialog.open(RecordsVisualizerComponent, {
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            data: {
              transcriptRecords: {...this.transcriptRecords},
              application: {...this.application}
            }
          });

          dialogRef.afterClosed().subscribe((updatedApplication: Application) => {
            if (updatedApplication) {
              console.log('Dati ricevuti dal dialog:', updatedApplication);
              this.application = updatedApplication;
              this.applicationModified.emit(updatedApplication._id);
              this.clonedCourses = updatedApplication.courses;
              this.rec.get_transcript_by_id(updatedApplication._id!).subscribe({
                next: (updatedTranscript) => {
                  this.transcriptRecords = updatedTranscript;
                }
              });
            }
          });
        },
        error: (err) => {
          console.log('Error occurred while getting: ' + err);
        }
      });
    }
  }

  // Open the editor needed to modify the learning of agreement
  openAgreementDialog() {
    const dialogRef = this.dialog.open(AgreementVisualizerComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '85vh',    
      data: {application: {...this.application}}
    });
      
    dialogRef.afterClosed().subscribe((updatedApplication: Application) => {
      if (updatedApplication) {
        console.log('Dati ricevuti dal dialog:', updatedApplication);
        this.application = updatedApplication;
        this.applicationModified.emit(updatedApplication._id);
        this.clonedCourses = updatedApplication.courses;
      }
    });
  }

  // Copy of courses
  copyOfCourses(){
    if (this.application?.courses) {
      this.clonedCourses = structuredClone(this.application.courses);
    }
  }

  get_transcript_by_id(id: string){
    
  }


  // Open application phase windows
  openApplicationPhase(templateRef: TemplateRef<any>) {
    this.dialogApplicationPhase = this.dialog.open(templateRef,{
      width: '400px',
      maxWidth: '90vw',
      maxHeight: '85vh'
    });

    this.dialogApplicationPhase .afterClosed().subscribe((updatedApplication: Application) => {
      if (updatedApplication) {
        console.log('Dati ricevuti dal dialog:', updatedApplication);
        this.application = updatedApplication;
        this.applicationModified.emit(updatedApplication._id);
        this.clonedCourses = updatedApplication.courses;
      }
    });
  }


  userIsLecturer() {
    return this.isLecturer;
  }

  userIsStaff() {
    return this.isStaff;
  }

  userIsStudent() {
    return this.isStudent;
  }

  // Needed to change phase status (only for staff)
  confirmPhaseUpdate(application: Application) {
    console.log(application);
    if(this.preDepartureCompleted || this.applicationClosed ) {

      if(this.preDepartureCompleted) {
        application.preDepartureCompleted = this.preDepartureCompleted;
        application.status = 'Mobility in progress';
      } else if(this.applicationClosed) {
        application.status = 'Closed';
      }

      this.ap.put_application_by_id(application).subscribe({
        next: () => {
          console.log("Application successfully modified.");
          //this.posted.emit(this.data.application);
          if(this.userIsStaff())
            this.dialogApplicationPhase.close();
        },
        error:(err) => {
          console.log('Error occurred while putting: ' + err);
        }
      });
    }
  }

  // Open the dates dialog editor
  openDateDialog(templateRef: TemplateRef<any>) {
    this.dialogConfirmDeletion = this.dialog.open(templateRef,{
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '85vh'
    });

    this.dialogConfirmDeletion .afterClosed().subscribe((updatedApplication: Application) => {
      if (updatedApplication) {
        console.log('Dati ricevuti dal dialog:', updatedApplication);
        
        this.applicationModified.emit(updatedApplication._id);
        this.clonedCourses = updatedApplication.courses;

      }
    });
  }

  // Update arrival and departure date
  confirmUpdateDate(application: Application) {
    console.log(application);
    application.arrivalDate = this.arrivalDateSelected;
    application.departureDate = this.departureDateSelected;
    this.ap.put_application_by_id(application).subscribe({
      next: () => {
        console.log("Application successfully modified.");
        //this.posted.emit(this.data.application);

      },
      error:(err) => {
        console.log('Error occurred while putting: ' + err);
      }
      
    });
    this.dialogConfirmDeletion.close(application);
  }

  // Needed for visualization
  verifyStateApplicationRequirement() {
    if(this.application?.status === 'Awaiting Agreement approval') {
      return this.canVerifyPreDeparture;
    } else if (this.application?.status === 'Waiting for exam score approval') {
      return this.recordsUploaded;
    } else {
      return false;
    }

  }

  applicationIsEditable() {
    const created = this.application?.status === 'Created';
    const notClosed = this.application?.status !== 'Closed';
    const notCanceled = this.application?.status !== 'Canceled';
    return created && notClosed && notCanceled;
  }

}


