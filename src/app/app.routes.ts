// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';  // If you have any authentication guard

// Lazy load components
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',  // Redirect root path to login
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',  // Updated route for dashboard
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],  // Protect this route with AuthGuard
  },
  {
    path: 'files-list',  // Corrected route for the "Files List" page
    loadComponent: () => import('./files-list/files-list.component').then(m => m.FilesListComponent),
    canActivate: [AuthGuard],  // Protect this route with AuthGuard if needed
  },
  {
    path: '**',
    redirectTo: 'login',  // Redirect to login if the path doesn't match
  }
];
