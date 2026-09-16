import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { UserLoginComponent } from './user-login/user-login.component';
import { AppComponent } from './app.component';
import { UserSignupComponent } from './user-signup/user-signup.component';
import { DashboardStudentComponent } from './dashboard-student/dashboard-student.component';
import { DashboardLecturerComponent } from './dashboard-lecturer/dashboard-lecturer.component';
import { DashboardStaffComponent } from './dashboard-staff/dashboard-staff.component';
import { HistoryTabComponent } from './history-tab/history-tab.component';
import { authGuard } from './auth.guard';

const routes: Routes = [
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: UserLoginComponent },
  { path: 'signup', component: UserSignupComponent },
  { path: 'dashboard-student', component: DashboardStudentComponent, canActivate: [authGuard] },
  { path: 'dashboard-lecturer', component: DashboardLecturerComponent, canActivate: [authGuard] },
  { path: 'dashboard-staff', component: DashboardStaffComponent, canActivate: [authGuard] },
  { path: 'history-tab', component: HistoryTabComponent, canActivate: [authGuard] }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
