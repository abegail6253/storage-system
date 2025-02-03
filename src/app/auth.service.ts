import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

interface LoginResponse {
  email: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private logoutTimer: any;

  constructor(private http: HttpClient) { }

  // Login method to send credentials and receive a token
  login(username: string, password: string): Observable<any> {
    return this.http.post<LoginResponse>('/login', { username, password }).pipe(
      tap(response => {
        localStorage.setItem('email', response.email);  // Ensure the email is being set here
        localStorage.setItem('token', response.token);
      })
    );
  }
  
  // Get the email from the token
  getUserEmail(): string | null {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      return decodedToken?.email || null; // Access email directly from decoded token
    }
    return null;
  }
  

  // Get the token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Logout method to clear the session
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('email'); // Remove email from localStorage
    // Redirect the user to the login page
    window.location.href = '/login';
  }

  // Check if the token is expired
  checkTokenExpiration(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;  // No token found, assume expired or not logged in
    }

    try {
      const decodedToken: any = jwtDecode(token);  // Use jwtDecode here
      const currentTime = Math.floor(Date.now() / 1000);  // Get the current time in seconds

      if (decodedToken.exp < currentTime) {
        // Token has expired
        this.logout();  // Log the user out if the token has expired
        return false;  // Token is expired
      }

      return true;  // Token is valid
    } catch (error) {
      console.error('Error decoding token', error);
      return false;
    }
  }

  // Start the logout timer when the user logs in
  startLogoutTimer(): void {
    // Automatically log out after 10 seconds (10000ms)
    this.logoutTimer = setTimeout(() => {
      this.logout();  // Log the user out by calling the logout method
    }, 10000);  // 10 seconds timeout
  }

  // Clear the logout timer when the user performs any action
  resetLogoutTimer(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);  // Clear the previous timer
    }
    this.startLogoutTimer();  // Start a new logout timer
  }
}
