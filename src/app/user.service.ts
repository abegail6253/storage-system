import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000'; // Your backend API URL
  private token: string | null = null;

  constructor(private http: HttpClient) {}

  // Register a new user
  register(username: string, password: string, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, password, email });
  }

  // Login a user and save the token
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password });
  }

  // Store token in local storage after login
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Get token from local storage
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Fetch the logged-in user's profile
  getUserProfile(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/profile`, { headers });
  }

  // Log the user out and remove the token
  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }
}
