import { Component, OnInit, signal, TemplateRef, Input, Output, EventEmitter } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FieldGroupResult,FieldGroupEditor, FieldGroup, GroupedField, FIELD_GROUP_LABELS, dateOptions, CourseEval } from '../application';
import { TranscriptRecord } from '../transcriptRecord';
import { ApplicationHttpService } from '../application-http.service';
import { UserHttpService } from '../user-http.service';
import { TranscriptRecordHttpService } from '../transcript-record-http.service';
import { AgreementHttpService } from '../agreement-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AgreementViewerDialogComponent } from '../agreement-viewer-dialog/agreement-viewer-dialog.component';
import { ApplicationEditorComponent } from '../application-editor/application-editor.component';
import { RecordsVisualizerComponent } from '../records-visualizer/records-visualizer.component';
import { AgreementVisualizerComponent } from '../agreement-visualizer/agreement-visualizer.component';

@Component({
  selector: 'app-application-status',
  templateUrl: './application-status.component.html',
  styleUrls: ['./application-status.component.css'],
  standalone: false
})
export class ApplicationStatusComponent implements OnInit {

  @Input() application: Application | null = null;
  @Output() applicationDeleted = new EventEmitter<string>();
  public fieldGroupEdited: FieldGroupEditor[] = [];
  clonedCourses: CourseEval[] = [];
  public openConfirmDialog: boolean = false;
  public dialogConfirmDeletion: any;
  public transcriptRecords: TranscriptRecord | null = null;

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
    this.copyOfCourses();
    if(!this.application) {
      this.get_application_by_matrNumber(this.us.get_username());
      this.sio.connect().subscribe( (m) => {
      this.get_application_by_matrNumber(this.us.get_username());
    });
    }
    
    this.openConfirmDialog = false;
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

  // Needed to hide some fields
  private hiddenFields = ['_id', '__v', 'modified', 'status', 'approved', 'courses'];

  isVisibleField(key: string): boolean {
    return !this.hiddenFields.includes(key);
  }

  // Needed to organize the fields
  private generalData = ['uploadD0ate', 'academicYear', 'semester'];
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


  public get_application_by_matrNumber(matrNumber : string) {
    this.ap.get_application_by_matrNumber(matrNumber).subscribe( {
      next: (application) => {
        console.log("Application successfully received.");
        
        this.application = application;
        if (this.application?.courses) {
          this.clonedCourses = structuredClone(this.application.courses);
        }
        
      },
      error: (err) => {
        // Application not found
        if (err.status === 404) {
          this.application = null;
        } else {
          // In other case the system will logout
          // this.logout();
        }
      }
    });
  }

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
        
        this.get_application_by_matrNumber(this.us.get_username());
        this.clonedCourses = updatedApplication.courses;
      }
    });
  }

  // Delete the application permanentely
  openDeleteDialog(templateRef: TemplateRef<any>) {
    this.dialogConfirmDeletion = this.dialog.open(templateRef,{
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '85vh'
    });

    this.dialogConfirmDeletion .afterClosed().subscribe((updatedApplication: Application) => {
      if (updatedApplication) {
        console.log('Dati ricevuti dal dialog:', updatedApplication);
        
        this.get_application_by_matrNumber(this.us.get_username());
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
              this.get_application_by_matrNumber(this.us.get_username());
              this.clonedCourses = updatedApplication.courses;
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
        
        this.get_application_by_matrNumber(this.us.get_username());
        this.clonedCourses = updatedApplication.courses;
      }
    });
  }

  copyOfCourses(){
    if (this.application?.courses) {
      this.clonedCourses = structuredClone(this.application.courses);
    }
  }

  get_transcript_by_id(id: string){
    
  }

}


