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
  selector: 'app-dashboard-lecturer',
  templateUrl: './dashboard-lecturer.component.html',
  styleUrl: './dashboard-lecturer.component.css',
  standalone: false
})
export class DashboardLecturerComponent implements OnInit {
  
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
    this.get_application_by_referent(this.us.get_username());
    this.sio.connect().subscribe( (m) => {
      this.get_application_by_referent(this.us.get_username());
    });
  }


  public get_application_by_referent(referent: string) {
    this.ap.get_application_by_query({ referent: referent }).subscribe( {
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

  // Needed to make the expansion panel not to collapse
  trackByApplicationId(index: number, application: Application): string {
    return application._id ?? index.toString();
  }

  // Needed to update the dashboard after a delete
  onApplicationDeleted(id: string) {
    this.get_application_by_referent(this.us.get_username());
  }

}
