import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';  
import { JwtService } from './jwt.service';  
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';  
import { MainLayoutComponent } from './main-layout/main-layout.component';  

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainLayoutComponent, CommonModule, RouterModule],  
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'storage-system';
  isLoggedIn: boolean = false;  // Track login state
  isLoginPage: boolean = false;  // Track if we are on the login page

  constructor(
    private jwtService: JwtService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkLoginStatus();  // Check login status when component initializes
    this.router.events.subscribe(() => {
      this.checkIfLoginPage();  // Check if on login page on route changes
    });
  }

  checkLoginStatus() {
    this.isLoggedIn = !!this.jwtService.getToken();  // Check if there's a valid token
  }

  checkIfLoginPage() {
    this.isLoginPage = this.router.url === '/login';  // Check if current route is the login page
  }
}
