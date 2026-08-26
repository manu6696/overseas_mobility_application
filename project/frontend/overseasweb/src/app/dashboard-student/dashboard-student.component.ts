import { Component, inject,  OnInit, Input, Output, EventEmitter  } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS, FieldGroupEditor, GroupedFieldEditor, dateOptions} from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AgreementViewerDialogComponent } from '../agreement-viewer-dialog/agreement-viewer-dialog.component';
import { AgreementHttpService } from '../agreement-http.service';
import { ApplicationEditorComponent } from '../application-editor/application-editor.component';

@Component({
  selector: 'app-dashboard-student',
  templateUrl: './dashboard-student.component.html',
  styleUrl: './dashboard-student.component.css',
  standalone: false
})
export class DashboardStudentComponent implements OnInit  {
  
  public application: Application | null = null;

  constructor( private sio: SocketioService , 
    public ap: ApplicationHttpService, 
    public us: UserHttpService, 
    private router: Router, 
    private dialog: MatDialog, 
    private sanitizer: DomSanitizer, 
    private ag: AgreementHttpService ) { }
    

  ngOnInit() {
    this.get_application_by_status(this.us.get_username(), 'Pending');
    this.sio.connect().subscribe( (m) => {
      this.get_application_by_status(this.us.get_username(), 'Pending');
    });
  }

  public get_application_by_status(matrNumber : string, applicationStatus : string) {
    this.ap.get_application_by_status(matrNumber, applicationStatus).subscribe( {
      next: (application) => {
        console.log("Application successfully received.");
        console.log("application");
        this.application = application;
        
      },
      error: (err) => {
        // Application not found
        if (err.status === 404) {
          let newApplications : Application = {
                _id: '',
                id: '',
                uploadDate: new Date,
                status: 'Created',
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
                approved: false,
                modified: false,
                lecturerReason: 'No reason provided',
          };
          this.application = newApplications;
        } else {
          // In other case the system will logout
          // this.logout();
        }
      }
    });
  }


  openApplicationCreator() {
    const dialogRef = this.dialog.open(ApplicationEditorComponent, {
      width: '1000px',
      maxWidth: '90vw',
      maxHeight: '85vh',    
      data: {application: {...this.application}}
    });

  }

}
