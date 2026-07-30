import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserHttpService } from './user-http.service';
import { io } from "socket.io-client";

@Injectable()
export class SocketioService {

  constructor( private us: UserHttpService ) { }

  connect(): Observable< any > {

    return new Observable( (observer) => {

      // Here we manually create (and return) a new Observable. The
      // Observable constructor takes in input a function that is invoked
      // when an observer subscribes to this Observable.

      // The observer object has two functions: next and error.
      //
      // next should be invoked when new data is available.
      // error should be invoked if an error occurs when producing the values


      // Connect to the server
      let socket = io(this.us.host);

      // Register a callback when the "broadcast" event is received
      socket.on('broadcast', (m:any) => {
        console.log('Socket.io message received: ' + JSON.stringify(m) );
        observer.next( m ); // Here we notify the subscriber that a new value is available

      });

      // Register a callback when the "error" event occurrs
      socket.on('error', (err:any) => {
        console.log('Socket.io error: ' + err );
        observer.error( err ); // Here we notify the subscriber that an error occurred
      });

      // The return value of this function contains our "TearDownLogic".
      // Specifically, we return an object containing an "unsubscribe" 
      // method that might be invoked by the observer to unsubscribe
      // from our observable
      return { 
        unsubscribe: () => {
          // When the observer unsubscribes, we disconnect from the websocket
          // to get ready for the next subscription.
          socket.disconnect();
        } 
      };

    });

  }

}
