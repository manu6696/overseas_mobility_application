import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { UserHttpService } from './user-http.service';
import { Agreement } from './agreement';

@Injectable({
  providedIn: 'root'
})
export class AgreementHttpService {

  constructor( private http: HttpClient, private us: UserHttpService ) {
    console.log('Agreement service instantiated');
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

    return throwError(() => new Error('Something bad happened; please try again later.') );
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

  private create_options_multipart( params = {} ) {
    return  {
      headers: new HttpHeaders({
        authorization: 'Bearer ' + this.us.get_token(),
        'cache-control': 'no-cache'
      }),
      params: new HttpParams( {fromObject: params} )
    };

  }

  post_agreement( m: FormData, applicationId: string ): Observable<Agreement> {
    console.log('Posting ' + m.get );
    return this.http.post<Agreement>( this.us.url + '/agreements' + '/' + applicationId, m,  this.create_options_multipart() ).pipe(
      catchError(this.handleError)
    );
  }


  /*
  get_agreement_by_id( id: string ): Observable<Agreement> {
    return this.http.get<Agreement>( this.us.url + '/agreements' + '/' + id, this.create_options() ).pipe(
        catchError( this.handleError )
      );
  }
  */

  // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Blob
  get_agreement_by_id(agreementId: string): Observable<Blob> {
    //const params = new HttpParams().set('agreementId', agreementId);
    return this.http.get(this.us.url + '/agreements' + '/' + agreementId, {
      ...this.create_options(),
      responseType: 'blob'
    } );
  }

  get_agreement_list_no_content_by_query( params = {} ) : Observable<Agreement[]> {
    return this.http.get<any>( this.us.url + '/agreements', this.create_options( params ) ).pipe(
      map((response) => response.q),
      catchError( this.handleError )
    );
  }

  delete_agreement( id: string): Observable<Agreement> {
    console.log('Deleting Agreement ' + id );
    return this.http.delete<Agreement>( this.us.url + '/agreements' + '/' + id,  this.create_options() ).pipe(
      catchError(this.handleError)
    );
  }


  put_agreement( m: Agreement ): Observable<Agreement> {
    console.log('Updating ' + JSON.stringify(m) );
    return this.http.put<Agreement>( this.us.url + '/agreements' + '/' + m._id, m,  this.create_options() ).pipe(
      catchError(this.handleError)
    );
  }


}
