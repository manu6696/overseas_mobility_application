import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';


import { AppComponent } from './app.component';
import { MessageEditorComponent } from './message-editor/message-editor.component';
import { MessageListComponent } from './message-list/message-list.component';
import { DashboardStudentComponent } from './dashboard-student/dashboard-student.component';
import { DashboardLecturerComponent } from './dashboard-lecturer/dashboard-lecturer.component';
import { DashboardStaffComponent } from './dashboard-staff/dashboard-staff.component';
import { ApplicationStatusComponent } from './application-status/application-status.component';
import { ApplicationEditorComponent } from './application-editor/application-editor.component';

// Services
import { AgreementHttpService } from './agreement-http.service';
import { ApplicationHttpService } from './application-http.service';
import { HostHttpService } from './host-http.service';
import { TranscriptRecordHttpService } from './transcript-record-http.service';
import { UserHttpService } from './user-http.service';
import { UserLoginComponent } from './user-login/user-login.component';
import { AppRoutingModule } from './/app-routing.module';
import { UserSignupComponent } from './user-signup/user-signup.component';
import { SocketioService } from './socketio.service';


import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


@NgModule({ declarations: [
        AppComponent,
        MessageEditorComponent,
        MessageListComponent,
        UserLoginComponent,
        UserSignupComponent,
        DashboardStudentComponent,
        DashboardLecturerComponent,
        DashboardStaffComponent,
        ApplicationStatusComponent,
        ApplicationEditorComponent
    ],
    bootstrap: [AppComponent], 
    imports: [BrowserModule,
        FormsModule,
        AppRoutingModule,
        MatGridListModule,
        MatCardModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule], 
    providers: [
        { provide: UserHttpService, useClass: UserHttpService },
        { provide: SocketioService, useClass: SocketioService },
        { provide: AgreementHttpService, useClass: AgreementHttpService },
        { provide: ApplicationHttpService, useClass: ApplicationHttpService },
        { provide: HostHttpService, useClass: HostHttpService },
        { provide: TranscriptRecordHttpService, useClass: TranscriptRecordHttpService },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
