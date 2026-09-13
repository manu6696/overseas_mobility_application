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

const routes: Routes = [
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: UserLoginComponent },
  { path: 'signup', component: UserSignupComponent },
  { path: 'dashboard-student', component: DashboardStudentComponent },
  { path: 'dashboard-lecturer', component: DashboardLecturerComponent },
  { path: 'dashboard-staff', component: DashboardStaffComponent },
  { path: 'history-tab', component: HistoryTabComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
