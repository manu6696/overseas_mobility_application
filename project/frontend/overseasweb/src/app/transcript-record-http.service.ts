import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { UserHttpService } from './user-http.service';
import { TranscriptRecord } from './transcriptRecord';

@Injectable({
  providedIn: 'root'
})
export class TranscriptRecordHttpService {

  constructor( private http: HttpClient, private us: UserHttpService ) {
    console.log('Transcript of records service instantiated');
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

  post_transcript( m: TranscriptRecord ): Observable<TranscriptRecord> {
    console.log('Posting ' + JSON.stringify(m) );
    return this.http.post<TranscriptRecord>( this.us.url + '/transcriptRecords', m,  this.create_options() ).pipe(
      catchError(this.handleError)
    );
  }

  get_transcript_by_id( id: string ): Observable<TranscriptRecord> {
    console.log('Getting Transcript of Records ' + id );
    return this.http.get<any>( this.us.url + '/transcriptRecords' + '/' + id,  this.create_options() ).pipe(
      map((response) => response.q),
      catchError(this.handleError)
    );
  }

  delete_transcript( id: string): Observable<TranscriptRecord> {
    console.log('Deleting Transcript of Records ' + id );
    return this.http.delete<TranscriptRecord>( this.us.url + '/transcriptRecords' + '/' + id,  this.create_options() ).pipe(
      catchError(this.handleError)
    );
  }

  put_transcript(m: TranscriptRecord ): Observable<TranscriptRecord> {
    console.log('Updating ' + JSON.stringify(m) );
    return this.http.put<TranscriptRecord>( this.us.url + '/transcriptRecords' + '/' + m.applicationid, m,  this.create_options() ).pipe(
      catchError(this.handleError)
    );
  }
}
