import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',  // Make the service available globally in the app
})
export class JwtService {

  private tokenKey = 'token';  // Define the key under which the token will be stored in localStorage

  // Store the JWT token in localStorage
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Retrieve the JWT token from localStorage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Remove the JWT token from localStorage (for logout)
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // Check if there is a valid JWT token (including token expiration)
  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;  // No token found
    }

    const decodedToken = this.decodeToken(token);
    if (!decodedToken || !decodedToken.exp) {
      return false;  // Token is malformed or missing expiration
    }

    // Check if the token is expired
    const isExpired = decodedToken.exp * 1000 < Date.now();  // JWT expiration time is in seconds, so multiply by 1000
    if (isExpired) {
      this.removeToken();  // Token expired, remove it
      return false;
    }

    return true;  // Token is valid
  }

  // Decode the JWT token (optional, but useful for extracting data from the token)
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];  // Get the payload part of the token
      const decoded = atob(payload);  // Decode base64 encoded string
      return JSON.parse(decoded);  // Return the decoded payload as an object
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;  // Invalid token or error in decoding
    }
  }
}
