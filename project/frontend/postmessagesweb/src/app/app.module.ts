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


@NgModule({ declarations: [
        AppComponent,
        MessageEditorComponent,
        MessageListComponent,
        UserLoginComponent,
        UserSignupComponent
    ],
    bootstrap: [AppComponent], 
    imports: [BrowserModule,
        FormsModule,
        AppRoutingModule], 
    providers: [
        { provide: UserHttpService, useClass: UserHttpService },
        { provide: SocketioService, useClass: SocketioService },
        { provide: MessageHttpService, useClass: MessageHttpService },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
