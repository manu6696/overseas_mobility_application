import { Component, OnInit } from '@angular/core';
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
          this.logout();
        }
    }
    });
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/']);
  }








}
