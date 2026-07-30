import { Component, OnInit } from '@angular/core';
import { UserHttpService } from '../user-http.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-login',
    templateUrl: './user-login.component.html',
    styleUrls: ['./user-login.component.css'],
    standalone: false
})
export class UserLoginComponent implements OnInit {

  public errmessage = undefined;
  constructor( private us: UserHttpService, private router: Router  ) { }

  ngOnInit() {
  }

  login(mail: string, password: string, remember: boolean) {

    this.us.login(mail, password, remember).subscribe({
      next: (d) => {
        console.log('Login granted, calling router.navigate(/messages)');
        this.errmessage = undefined;
        this.router.navigate(['/messages']);
      },
      error: (err) => {
        console.log('Login error: ' + JSON.stringify(err));
        this.errmessage = err.message;
      }
    });

  }

}
