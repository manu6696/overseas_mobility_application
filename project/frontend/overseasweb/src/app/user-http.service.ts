import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import jwt_decode from "jwt-decode";



interface TokenData {
  username:string,
  mail:string,
  name: string,
  surname: string,
  roles:string[],
  id:string
}

interface ReceivedToken {
  token: string
}


export interface User { 
  mail:string,
  password:string, 
  username:string,
  name: string,
  surname: string,
  roles:string[] 
};

@Injectable({providedIn: 'root'})
export class UserHttpService {

  private token: string = '';
  public host = 'http://localhost:8080'
  public url = this.host+'/api/v1'; // WebService URL

  constructor( private http: HttpClient ) {
    console.log('User service instantiated');
    
    const loadedtoken = localStorage.getItem('mobility_application_token');
    if ( !loadedtoken || loadedtoken.length < 1 ) {
      console.log("No token found in local storage");
      this.token = ""
    } else {
      this.token = loadedtoken as string;
      console.log("JWT loaded from local storage.")
    }
  }

  login( mail: string, password: string, remember: boolean ): Observable<any> {

    console.log('Login: ' + mail + ' ' + password );
    const options = {
      headers: new HttpHeaders({
        authorization: 'Basic ' + btoa( mail + ':' + password),
        'cache-control': 'no-cache',
        'Content-Type':  'application/x-www-form-urlencoded',
      })
    };


    return this.http.get( this.url + '/login',  options, ).pipe(
      /*
      RxJS tap() operator is a utility operator that returns an observable output
      that is identical to the source observable but performs a side effect for
      every emission on the source observable.  

      In other words, RxJS tap() operator is used to intercept each emission on
      the source observable, runs a function, and returns an output that is
      identical to the source observable as long as it doesn't find any error.  
      
      This operator is generally used for debugging observables for the correct
      values or performing other side effects.
      */
      tap( (data) => {
        console.log("Data received when invoking the /login endpoint:")
        console.log(JSON.stringify(data));
        this.token = (data as ReceivedToken).token;
        if ( remember ) {
          console.log("Saving token to localstorage")
          localStorage.setItem('mobility_application_token', this.token as string);
        } else {
          console.log("Token not saved to local storage.")
        }
      }));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        'body was: ' + JSON.stringify(error.error));
    }

    return throwError(() => error);
    
  }

  /* Utility method to create the http options object (headers + query parameters) */
  private create_options( params = {} ) {
    return  {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + this.get_token(),
        'cache-control': 'no-cache',
        'Content-Type':  'application/json',
      }),
      params: new HttpParams( {fromObject: params} )
    };

  }

  logout() {
    console.log('Logging out');
    this.token = '';
    localStorage.setItem('mobility_application_token', this.token);
  }

  register( user:User ): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'cache-control': 'no-cache',
        'Content-Type':  'application/json',
      })
    };

    return this.http.post( this.url + '/users', user, options );

  }

  get_token() {
    return this.token;
  }

  get_username() {
    return (jwt_decode(this.token) as TokenData).username;
  }

  get_name() {
    return (jwt_decode(this.token) as TokenData).name;
  }

  get_surname() {
    return (jwt_decode(this.token) as TokenData).surname;
  }

  get_mail() {
    return (jwt_decode(this.token) as TokenData).mail;
  }

  get_id() {
    return (jwt_decode(this.token) as TokenData).id;
  }

  get_roles(): string[] {
    const roles = (jwt_decode(this.token) as TokenData).roles;
    const returnedRoles : string[] = [];
    for ( let idx = 0; idx < roles.length; ++idx ) {
      returnedRoles.push(roles[idx]);
    }
    return returnedRoles;

  }

  get_lecturers(): Observable<any[]> {
    return this.http.get<any>(this.url + '/users/lecturers', this.create_options()).pipe(
      map(res => res.lecturers),
      catchError(this.handleError)
    );
  }


  is_admin(): boolean {
    const roles = (jwt_decode(this.token) as TokenData).roles;
    for ( let idx = 0; idx < roles.length; ++idx ) {
      if ( roles[idx] === 'ADMIN' ) {
        return true;
      }
    }
    return false;
  }

  is_moderator(): boolean {
    const roles = (jwt_decode(this.token) as TokenData).roles;
    for ( let idx = 0; idx < roles.length; ++idx ) {
      if ( roles[idx] === 'MODERATOR' ) {
        return true;
      }
    }
    return false;
  }

  is_student(): boolean {
    const roles = (jwt_decode(this.token) as TokenData).roles;
    for ( let idx = 0; idx < roles.length; ++idx ) {
      if ( roles[idx] === 'STUDENT' ) {
        return true;
      }
    }
    return false;
  }

  is_lecturer(): boolean {
    const roles = (jwt_decode(this.token) as TokenData).roles;
    for ( let idx = 0; idx < roles.length; ++idx ) {
      if ( roles[idx] === 'LECTURER' ) {
        return true;
      }
    }
    return false;
  }

  is_staff(): boolean {
    const roles = (jwt_decode(this.token) as TokenData).roles;
    for ( let idx = 0; idx < roles.length; ++idx ) {
      if ( roles[idx] === 'STAFF' ) {
        return true;
      }
    }
    return false;
  }
}
