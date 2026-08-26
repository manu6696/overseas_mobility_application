import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';
import { SocketioService } from '../socketio.service';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: false
})
export class NavbarComponents {

  constructor( 
    private sio: SocketioService , 
    public us: UserHttpService, 
    private router: Router 
  ) { }
  
  ngOnInit() {
  }

  getInitials(): string {
    const username = this.us.get_username();
    return username ? username.substring(0, 2).toUpperCase() : '??';
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/']);
  }


}
