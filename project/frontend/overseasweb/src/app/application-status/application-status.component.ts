import { Component, OnInit, signal } from '@angular/core';
import { Application } from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';

@Component({
  selector: 'app-application-status',
  templateUrl: './application-status.component.html',
  styleUrls: ['./application-status.component.css'],
  standalone: false
})
export class ApplicationStatusComponent implements OnInit {

  public application: Application | null = null;

  constructor( private sio: SocketioService , public ap: ApplicationHttpService, public us: UserHttpService, private router: Router ) { }
  
  ngOnInit() {
    this.get_application_by_status(this.us.get_username(), 'Pending');
    this.sio.connect().subscribe( (m) => {
      this.get_application_by_status(this.us.get_username(), 'Pending');
    });
  }

  // Needed to mantain the original order of the 
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


  public get_application_by_status(matrNumber : string, applicationStatus : string) {
    this.ap.get_application_by_status(matrNumber, applicationStatus).subscribe( {
      next: (application) => {
        console.log("Application successfully received.");
        this.application = application;
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

  logout() {
    this.us.logout();
    this.router.navigate(['/']);
  }


  





}


