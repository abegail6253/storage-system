import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatButtonModule,
    CommonModule,
  ],
  templateUrl: './main-layout.component.html',  // Externalize template
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  userEmail: string | null = null;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Retrieve the email from UserService (to be consistent)
    this.userEmail = this.authService.getUserEmail();
  }

  logout(): void {
    // Perform logout logic
    this.authService.logout();  // Call logout method from AuthService
    localStorage.removeItem('email');  // Remove email from localStorage on logout
    localStorage.removeItem('token');  // Remove token from localStorage
    this.router.navigate(['/login']);  // Redirect to login page
  }
}
