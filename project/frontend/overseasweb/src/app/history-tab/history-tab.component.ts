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
import { AgreementHttpService } from '../agreement-http.service';
import { ApplicationEditorComponent } from '../application-editor/application-editor.component';
import { ApplicationCreatorComponent } from '../application-creator/application-creator.component';

@Component({
  selector: 'app-history-tab',
  templateUrl: './history-tab.component.html',
  styleUrl: './history-tab.component.css',
  standalone: false
})
export class HistoryTabComponent implements OnInit {

  public applications: Application[] = [];

  constructor( private sio: SocketioService , 
    public ap: ApplicationHttpService, 
    public us: UserHttpService, 
    private router: Router, 
    private dialog: MatDialog, 
    private sanitizer: DomSanitizer, 
    private ag: AgreementHttpService ) 
  { }

  ngOnInit() {
    this.get_application_by_referent(); 
    this.sio.connect().subscribe( (m) => {
      this.get_application_by_referent();
    });
  }

  public get_application_by_referent() {
    const isLecturer = this.us.is_lecturer();
    const isStaff = this.us.is_staff();
    const isStudent = this.us.is_student();

    if(isStudent) {
      this.ap.get_application_by_matrNumber(this.us.get_username()).subscribe( {
        next: (application) => {
          console.log("Application successfully received.");
          this.applications = application;
          
        },
        error: (err) => {
          // Application not found
            this.applications = [];
        }
      });
    }

    if(isLecturer) {
      this.ap.get_application_by_query({ referent: this.us.get_username() }).subscribe( {
        next: (applications) => {
          console.log("Applications successfully received.");
          this.applications = applications;
          
        },
        error: (err) => {
          // Application not found
          if (err.status === 404) {
            console.log("No applications found");
          } else {
            // In other case the system will logout
            // this.logout();
          }
        }
      }); 
    }


    if(isStaff) {
      this.ap.get_all_application().subscribe( {
        next: (applications) => {
          console.log("Applications successfully received.");
          this.applications = applications;
          
        },
        error: (err) => {
          // Application not found
          if (err.status === 404) {
            console.log("No applications found");
          } else {
            // In other case the system will logout
            // this.logout();
          }
        }
      });
    }

  }
}
