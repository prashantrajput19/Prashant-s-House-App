import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { Login } from '../models/login.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public apiUrl = environment.apiUrl;

  private currentUser: Partial<User> | null = null;

  private userRoleSubject = new BehaviorSubject<string | null>(null);
  private userIdSubject = new BehaviorSubject<number | null>(null);

  public userRole$ = this.userRoleSubject.asObservable();
  public userId$ = this.userIdSubject.asObservable();

  constructor(private http: HttpClient) { }

  register(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/register`, user);
  }

  sendOtp(email: string): Observable<{ cooldownSeconds: number; expiresInSeconds: number; devCode: string | null }> {
    return this.http.post<any>(`${this.apiUrl}/api/otp/send`, { email });
  }

  verifyOtp(email: string, code: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/otp/verify`, { email, code });
  }

  login(login: Login): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/login`, login).pipe(
      tap(response => {
        if (response?.token) {
          localStorage.clear();
          localStorage.setItem('token', response.token);
          this.setUser({
            userId: response.userId, username: response.username,
            userRole: response.userRole, masterAdmin: response.masterAdmin
          });
        }
      })
    );
  }

  restoreSession(): Observable<Partial<User> | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    return this.http.get<User>(`${this.apiUrl}/api/me`).pipe(
      tap(user => this.setUser(user)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/me/password`, { currentPassword, newPassword });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserRole(): string | null {
    return this.currentUser?.userRole ?? null;
  }

  getUserId(): number | null {
    return this.currentUser?.userId ?? null;
  }

  getUserName(): string {
    return this.currentUser?.username ?? '';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'Admin';
  }

  isUser(): boolean {
    return this.getUserRole() === 'User';
  }

  isMasterAdmin(): boolean {
    return this.currentUser?.masterAdmin === true;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser;
  }

  logout(): void {
    localStorage.clear();
    this.setUser(null);
  }

  private setUser(user: Partial<User> | null): void {
    this.currentUser = user;
    this.userRoleSubject.next(user?.userRole ?? null);
    this.userIdSubject.next(user?.userId ?? null);
  }
}
