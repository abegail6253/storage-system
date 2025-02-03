import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtService } from '../jwt.service';  // Ensure you have this service for JWT handling
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private jwtService: JwtService
  ) {}

  onSubmit() {
    this.isLoading = true;
    const loginData = { username: this.username, password: this.password };
  
    console.log('Sending login request with data:', loginData);  // Log request data
  
    this.http.post('http://localhost:3000/login', loginData).subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response?.token) {
          this.jwtService.saveToken(response.token);
          
          // Decode and extract email from JWT token
          const decodedToken = this.decodeToken(response.token);
          localStorage.setItem('email', decodedToken.email);  // Save email in localStorage
  
          console.log('Login successful, token received:', response.token);
          console.log('User email extracted from token:', decodedToken.email); // Log the email
  
          // Log the successfully logged-in user email to the console
          console.log(`User logged in: ${decodedToken.email}`);  // Logs the user email to console
  
          // Redirect to the dashboard route
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Login failed, no token received';
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Login failed, error:', error);
        this.errorMessage = error?.error?.message || 'Login failed, please try again';
  
        if (error?.error) {
          console.error('Error Response:', error.error);
        }
      }
    );
  }
  

  // Decode the JWT token to extract user data
  decodeToken(token: string) {
    const payload = token.split('.')[1]; // Get the payload part
    const decoded = atob(payload);  // Decode the base64 payload
    return JSON.parse(decoded);  // Parse it into JSON
  }
}
