import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { JwtService } from './jwt.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);  // Inject the JWT service
  const router = inject(Router);  // Inject the Router to redirect on 401

  const token = jwtService.getToken();
  if (token) {
    // Clone the request and add the Authorization header with the token
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(clonedReq).pipe(
      catchError((error) => {
        if (error.status === 401) {
          // Token expired or invalid, handle logout
          jwtService.removeToken();  // Remove token to log out the user

          // Show the alert immediately
          alert('Your session has expired. You have been logged out.');

          // Delay redirecting to the login page to ensure the alert is visible
          setTimeout(() => {
            router.navigate(['/login']);  // Redirect to login page after the alert
          }, 100);  // Short delay to ensure the alert shows up
        }
        return of(error); // Continue with the error handling
      })
    );
  }

  return next(req);  // If no token, continue with the original request
};
