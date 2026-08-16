import { Component, OnInit } from '@angular/core';
import { Application } from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';

@Component({
  selector: 'app-application-editor',
  templateUrl: './application-editor.component.html',
  styleUrls: ['./application-editor.component.css'],
  standalone: false
})
export class ApplicationEditorComponent implements OnInit {

  constructor( private ap: ApplicationHttpService ) { }
    public application: Application = this.set_empty();

  ngOnInit() {
    this.set_empty();
  }

  set_empty(): Application {
      this.application = {
        _id: '',
        id: '',
        status: '',
        uploadDate: new Date(),
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
        courses: [],
        referent: '',
        approved: false,
        modified: false,
        lecturerReason: ''
      };
      return this.application;
    }

}
