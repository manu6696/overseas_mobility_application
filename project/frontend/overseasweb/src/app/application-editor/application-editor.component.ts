import { Component, Inject, OnInit } from '@angular/core';
import { Application } from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-application-editor',
  templateUrl: './application-editor.component.html',
  styleUrls: ['./application-editor.component.css'],
  standalone: false
})
export class ApplicationEditorComponent implements OnInit {

  public application: Application | null = null;

  constructor( @Inject(MatDialog) public data: { application: Application }, private sio: SocketioService , private ap: ApplicationHttpService, public us: UserHttpService, private router: Router,  private sanitizer: DomSanitizer) { }

    

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




  



  modifyApplicationContent(application: Application) : void {





  }








}
