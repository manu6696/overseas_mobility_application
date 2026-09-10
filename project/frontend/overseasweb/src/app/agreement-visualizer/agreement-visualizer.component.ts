import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Application, APPLICATION_FIELD_META, FIELD_GROUP_LABELS, FieldGroupEditor, GroupedFieldEditor, dateOptions} from '../application';
import { ApplicationHttpService } from '../application-http.service';
import { Host } from '../host';
import { HostHttpService } from '../host-http.service';
import { UserHttpService } from '../user-http.service';
import { AgreementHttpService } from '../agreement-http.service';
import { Agreement } from '../agreement';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-agreement-visualizer',
  templateUrl: './agreement-visualizer.component.html',
  styleUrls: ['./agreement-visualizer.component.css'],
  standalone: false
})
export class AgreementVisualizerComponent implements OnInit {

  public application: Application | null = null;
  public agreements: Agreement[] = [];
  public userRoles : string[] = [];
  public fieldGroupEdited: FieldGroupEditor[] = [];
  public newModifyDescription: string = "";
  public newAgreement : Agreement | null = null;
  public selectedFile : File | null = null;
  public approvedState: string[] = ['Pending', 'Approved','Rejected'];
  @Output() posted = new EventEmitter<Application>();

  constructor( 
    public dialogRef: MatDialogRef<AgreementVisualizerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { application: Application }, 
    private sio: SocketioService , 
    private ap: ApplicationHttpService, 
    public us: UserHttpService, 
    public ho: HostHttpService, 
    private router: Router,  
    private ag: AgreementHttpService,
    private sanitizer: DomSanitizer) { }


  ngOnInit() {
    this.userRoles = this.us.get_roles();
    this.fieldGroupEdited = this.getFieldsByCategoryEditor(this.data.application);
    this.get_agreement_list_by_query(this.data.application._id!);
    this.sio.connect().subscribe((m) => {
      this.get_agreement_list_by_query(this.data.application._id!);
    });

  }


  public get_agreement_list_by_query(applicationid : string){

    this.ag.get_agreement_list_no_content_by_query({applicationid}).subscribe( {
      next: (agreements) => {
        console.log("Application successfully received.");
        this.agreements = agreements;
        
      },
      error: (err) => {
        // Application not found
          this.agreements = [];
      }
    });

  }



  getFieldsByCategoryEditor(app: Application): FieldGroupEditor[] {

    const applicationsKeys = Object.keys(app);
    let groups : FieldGroupEditor[] = [];

    for(const key of applicationsKeys) {
      
      const metaKey = APPLICATION_FIELD_META[key as keyof Application];
      if(metaKey === undefined) continue;
      if((!metaKey.hidden || metaKey.label === 'Courses') && metaKey.label !== 'Upload Date') {
        const groupName = FIELD_GROUP_LABELS[metaKey.group];
        const groupsFinded = groups.find(elemento => elemento.groupLabel === groupName);

        // Check if the user can edit the field
        const roles: string[] = this.us.get_roles();
        let editable: boolean = false;
        
        for(const role in roles) {
          if(metaKey.editableFrom.includes(roles[role])) {
            editable = true;
          }
        } 

        if(!groupsFinded) {
          groups.push({groupLabel: groupName, fields: [{key: key as keyof Application, name: metaKey.label, isEditable: editable}]});
        } else {
          groupsFinded.fields.push({key: key as keyof Application, name: metaKey.label, isEditable: editable});
        }
      }
    }

    return groups;
  }


  // Open a new windows for the learning agreement pdf
  openPdfViewer(applicationId: string) {
    console.log("Application id Is: " + applicationId);
    this.ag.get_agreement_by_id(applicationId).subscribe({
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

  // Saving agreement
  onAgreementSave() {
    const formData = new FormData();
  
    const date = new Date;
    formData.append('agreement', this.selectedFile!);
    formData.append('matrNumber', this.data.application.matrNumber);
    formData.append('modifyDescription', this.newModifyDescription);

    this.ag.post_agreement(formData, this.data.application._id!).subscribe({
      next: () => {
        this.get_agreement_list_by_query(this.data.application._id!);
        this.newModifyDescription = '';
      },
      error: (err) => {
        console.error("Error saving PDF:", err);
      }
    });

  }

  // Updating agreement
  onAgreementUpdate(agreement: Agreement) {

    this.ag.put_agreement(agreement).subscribe({
      next: () => {
        this.ag.get_agreement_by_id(agreement._id!);
      },
      error: (err) => {
        console.error("Error updating agreement:", err);
      }
    });


  }

  userIsLecturer() {
    return this.us.is_lecturer();
  }


}
