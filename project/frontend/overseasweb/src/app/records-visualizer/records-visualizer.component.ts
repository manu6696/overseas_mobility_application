import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS, FieldGroupEditor, GroupedFieldEditor, dateOptions} from '../application';
import { TranscriptRecord, CourseResult } from '../transcriptRecord';
import { Host } from '../host';
import { HostHttpService } from '../host-http.service';
import { UserHttpService } from '../user-http.service';
import { TranscriptRecordHttpService } from '../transcript-record-http.service';
import { ApplicationHttpService } from '../application-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSelectChange } from '@angular/material/select';


@Component({
  selector: 'app-records-visualizer',
  templateUrl: './records-visualizer.component.html',
  styleUrls: ['./records-visualizer.component.css'],
  standalone: false
})
export class RecordsVisualizerComponent implements OnInit{

  public clonedTranscriptRecords: string[] = []
  public userRoles : string[] = [];
  public fieldGroupEdited: FieldGroupEditor[] = [];
  public examDate : Date[] = [];
  public isLecturer: boolean = false;
  public selectedFile : File | null = null;
  public recordState: string[] = [
    'Pending',
    'Approved',
    'Rejected'];
  public recordStateSelected: string[] = [];
  @Output() posted = new EventEmitter<Application>();

  constructor( 
    public dialogRef: MatDialogRef<RecordsVisualizerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      transcriptRecords: TranscriptRecord;
      application: Application;
    }, 
    private sio: SocketioService , 
    private ap: ApplicationHttpService, 
    public us: UserHttpService, 
    public ho: HostHttpService, 
    private router: Router,  
    private sanitizer: DomSanitizer,
    private rec: TranscriptRecordHttpService) 
  { }

  ngOnInit() {
    this.userRoles = this.us.get_roles();
    this.isLecturer = this.us.is_lecturer();
    //this.clonedTranscriptRecords = this.data.application.courses.map(() => 0);
    this.clonedTranscriptRecords = this.data.transcriptRecords.records.map((elemento) => {
      return elemento.grade;
    })

    this.examDate = this.data.transcriptRecords.records.map((elemento) => {
      return elemento.examDate;
    })

    this.recordStateSelected = this.data.transcriptRecords.records.map((elemento) => {
      return elemento.approved;
    })
  }

  buildRecordsPayload() {
    return this.data.application.courses.map((elemento, index) => {
      return {
        code: elemento.equivalentCourse.code,
        grade: this.clonedTranscriptRecords[index],
        examDate: this.examDate[index],
        approved: this.recordStateSelected[index] ?? 'Pending'
      }
    });


  }

  userIsLecturer() {
    return this.isLecturer;
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

  // Saving transcript
  onTranscriptSave() {
    const formData = new FormData();
    formData.append('applicationid', this.data.application._id!);
    formData.append('matrNumber', this.data.application.matrNumber);
    formData.append('records', JSON.stringify(this.buildRecordsPayload()));

    if (this.selectedFile) {
      formData.append('transcriptRecords', this.selectedFile);
    }

    const isUpdate = !!this.data.transcriptRecords?._id;

    const request$ = isUpdate
      ? this.rec.put_transcript(formData, this.data.application._id!)
      : this.rec.post_transcript(formData);

    request$.subscribe({
      next: () => {
        this.rec.get_transcript_by_id(this.data.application._id!).subscribe({
          next: (tr) => {
            this.data.transcriptRecords = tr;
            if(this.us.is_student()) {
              this.ap.get_application_by_matrNumber(this.us.get_username()).subscribe({
                next: (application) => {
                  this.data.application = application.find((elemento) => elemento._id === this.data.application._id!)!;
                  this.dialogRef.close(this.data.application);
                }, 
                error: (err) => {
                  console.log("Error getting application", err);
                }
              });
            } else {
              this.dialogRef.close(this.data.application);
            }
            

          },
          error: (err) => {
            console.error(err);
          }
        });
      },
      error: (err) => console.error("Error saving transcript:", err)
    });
  }
  

  // Open a new windows for the learning agreement pdf
  openPdfViewer(applicationId: string) {
    console.log("Application id Is: " + applicationId);
    this.rec.get_transcript_file_by_id(applicationId).subscribe({
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

}
