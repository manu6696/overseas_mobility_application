import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { UserHttpService } from './user-http.service';
import { Application } from './application';

  interface ApiResponse {
    error: boolean;
    errormessage: string;
    id?: string;
  }


@Injectable({
  providedIn: 'root'
})
export class ApplicationHttpService {

  
  constructor( private http: HttpClient, private us: UserHttpService ) { // We require the UserHttpService to provide the JWT when invoking message related endpoints
    console.log('Application service instantiated');
    console.log('User service token: ' + us.get_token() );
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
        authorization: 'Bearer ' + this.us.get_token(),
        'cache-control': 'no-cache',
        'Content-Type':  'application/json',
      }),
      params: new HttpParams( {fromObject: params} )
    };

  }

  get_application_by_query( params = {} ): Observable<Application[]> {
    return this.http.get<any>( this.us.url + '/applications', this.create_options( params ) ).pipe(
      map((response) => response.q),
      catchError( this.handleError )
    );
  }

  get_application_by_status( matrNumber : string, applicationStatus : string ): Observable<Application> {
    return this.http.get<any>( this.us.url + '/applications' + '/' + matrNumber + '/' + applicationStatus, this.create_options() ).pipe(
      map((response) => response.q[0]),
      catchError( this.handleError )
    );
  }


  post_application_by_matrNumber( m : Application): Observable<ApiResponse> {
    return this.http.post<ApiResponse>( this.us.url + '/applications' + '/' + m.matrNumber, m, this.create_options() ).pipe(
      catchError( this.handleError )
    );
  }

  put_application_by_id( m: Application): Observable<ApiResponse> {
    console.log('Updating ' + JSON.stringify(m) );
    return this.http.put<ApiResponse>( this.us.url + '/applications' + '/' + m.id, m,  this.create_options() ).pipe(
      catchError(this.handleError)
    );
  }

  delete_application_by_id( id: string): Observable<ApiResponse> {
    console.log('Deleting Application' + id );
    return this.http.delete<ApiResponse>( this.us.url + '/applications' + '/' + id, this.create_options() ).pipe(
      catchError(this.handleError)
    );
  }

}



