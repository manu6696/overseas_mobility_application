import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';


import { AppComponent } from './app.component';
import { MessageEditorComponent } from './message-editor/message-editor.component';
import { MessageListComponent } from './message-list/message-list.component';

// Services
import { MessageHttpService } from './message-http.service';
import { UserHttpService } from './user-http.service';
import { UserLoginComponent } from './user-login/user-login.component';
import { AppRoutingModule } from './/app-routing.module';
import { UserSignupComponent } from './user-signup/user-signup.component';
import { SocketioService } from './socketio.service';
import { DashboardProvaComponent } from './dashboard-prova/dashboard-prova.component';
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
        DashboardProvaComponent
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
        { provide: MessageHttpService, useClass: MessageHttpService },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
