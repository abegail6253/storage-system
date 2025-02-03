import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { JwtInterceptor } from './app/jwt-interceptor.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';  // Use the correct import

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([JwtInterceptor])),  // Use the correct interceptor
    provideAnimations(), provideAnimationsAsync(),
  ],
}).catch((err) => console.error(err));
