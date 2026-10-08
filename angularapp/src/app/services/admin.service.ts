import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  public apiUrl = `${environment.apiUrl}/api/admin/users`;

  constructor(private http: HttpClient) { }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  makeAdmin(userId: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}/make-admin`, {});
  }

  removeAdmin(userId: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}/remove-admin`, {});
  }
}
