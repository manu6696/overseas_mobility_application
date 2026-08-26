import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS, FieldGroupEditor, GroupedFieldEditor, dateOptions} from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { Host } from '../host';
import { HostHttpService } from '../host-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-application-creator',
  templateUrl: './application-creator.component.html',
  styleUrls: ['./application-creator.component.css'],
  standalone: false
})
export class ApplicationCreatorComponent {

  public application: Application | null = null;
  public hosts: Host[] = [];
  public userRoles : string[] = [];
  public fieldGroupEdited: FieldGroupEditor[] = [];

  constructor( 
    @Inject(MAT_DIALOG_DATA) public data: { application: Application }, 
    private sio: SocketioService , 
    private ap: ApplicationHttpService, 
    public us: UserHttpService, 
    public ho: HostHttpService, 
    private router: Router,  
    private sanitizer: DomSanitizer) { }

  @Output() posted = new EventEmitter<Application>();

  ngOnInit() {
    this.userRoles = this.us.get_roles();
  }

}
