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
    const name = this.us.get_name();
    const surname = this.us.get_surname();
    const userInitials = name?.substring(0,1).toUpperCase() + surname?.substring(0,1).toUpperCase()
    return userInitials;
  }

  logout() {
    this.us.logout();
    this.router.navigate(['/']);
  }


  userIsStudent(){
    return this.us.is_student();
  }

  userIsModerator(){
    return this.us.is_moderator();
  }

  userIsAdmin(){
    return this.us.is_admin();
  }


}
