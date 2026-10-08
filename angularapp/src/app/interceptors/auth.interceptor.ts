import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private static readonly PUBLIC_PATHS = ['/api/login', '/api/register', '/api/otp/'];

  constructor(private injector: Injector, private router: Router) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isBackend = request.url.startsWith(environment.apiUrl);
    const isPublic = AuthInterceptor.PUBLIC_PATHS.some(path => request.url.includes(path));
    const token = localStorage.getItem('token');

    const authorized = isBackend && !isPublic && token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

    return next.handle(authorized).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && isBackend && !isPublic && !request.url.endsWith('/api/me')) {
          this.injector.get(AuthService).logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
