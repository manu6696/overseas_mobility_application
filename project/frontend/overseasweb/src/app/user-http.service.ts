import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import jwt_decode from "jwt-decode";



interface TokenData {
  username:string,
  mail:string,
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
  roles:string[] 
};

@Injectable()
export class UserHttpService {

  private token: string = '';
  public host = 'http://localhost:8080'
  public url = this.host+'/api/v3'; // WebService URL

  constructor( private http: HttpClient ) {
    console.log('User service instantiated');
    
    const loadedtoken = localStorage.getItem('postmessages_token');
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
          localStorage.setItem('postmessages_token', this.token as string);
        } else {
          console.log("Token not saved to local storage.")
        }
      }));
  }

  logout() {
    console.log('Logging out');
    this.token = '';
    localStorage.setItem('postmessages_token', this.token);
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

  get_mail() {
    return (jwt_decode(this.token) as TokenData).mail;
  }

  get_id() {
    return (jwt_decode(this.token) as TokenData).id;
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
}
