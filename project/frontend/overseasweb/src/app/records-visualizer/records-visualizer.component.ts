import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS, FieldGroupEditor, GroupedFieldEditor, dateOptions} from '../application';
import { TranscriptRecord } from '../transcriptRecord';
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

  @Output() posted = new EventEmitter<Application>();



  ngOnInit() {
    this.userRoles = this.us.get_roles();
    
    //this.clonedTranscriptRecords = this.data.application.courses.map(() => 0);
    this.clonedTranscriptRecords = this.data.transcriptRecords.records.map((elemento) => {
      return elemento.grade;
    })
  }

  recordsSaveChanges() {
    
    this.data.transcriptRecords.applicationid = this.data.application._id ?? '';
    this.data.transcriptRecords.matrNumber = this.data.application?.matrNumber;   
    this.data.transcriptRecords.records = this.data.application.courses.map((elemento, index) => {
      return {
        code: elemento.equivalentCourse.code,
        grade: this.clonedTranscriptRecords[index]
      }
    });

    this.rec.put_transcript(this.data.transcriptRecords).subscribe({
      next: () => {
        console.log("Transcript of records succesfully modified");
        this.dialogRef.close();
      },
      error: (err) => {
        console.log('Error occurred while putting: ' + err);
      }
    });

  }
  
  






}
