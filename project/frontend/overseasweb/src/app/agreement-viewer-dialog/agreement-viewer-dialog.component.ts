import { Component, Inject, OnInit  } from '@angular/core';
import { Agreement } from '../agreement';
import { AgreementHttpService } from '../agreement-http.service';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-agreement-viewer-dialog',
  templateUrl: './agreement-viewer-dialog.component.html',
  styleUrls: ['./agreement-viewer-dialog.component.css'],
  standalone: false
})
export class AgreementViewerDialogComponent implements OnInit{

  public safePdfUrl: SafeResourceUrl | null = null;

  constructor(
    @Inject(MatDialog) public data: { pdfUrl: string },
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    if (this.data?.pdfUrl) {
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.pdfUrl);
    }
  }

  ngOnDestroy() {
    if (this.data?.pdfUrl) {
      URL.revokeObjectURL(this.data.pdfUrl);
    }
  }

}
