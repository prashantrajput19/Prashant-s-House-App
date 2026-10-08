import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Architect, TopArchitect } from '../models/architect.model';

@Injectable({
  providedIn: 'root'
})
export class ArchitectService {
  public apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllArchitects(): Observable<Architect[]> {
    return this.http.get<Architect[]>(`${this.apiUrl}/api/architects`);
  }

  getTopRated(): Observable<TopArchitect[]> {
    return this.http.get<TopArchitect[]>(`${this.apiUrl}/api/architects/top-rated`);
  }

  getArchitectById(architectId: number): Observable<Architect> {
    return this.http.get<Architect>(`${this.apiUrl}/api/architects/${architectId}`);
  }

  addArchitect(architect: Architect): Observable<Architect> {
    return this.http.post<Architect>(`${this.apiUrl}/api/architects`, architect);
  }

  updateArchitect(architectId: number, architect: Architect): Observable<Architect> {
    return this.http.put<Architect>(`${this.apiUrl}/api/architects/${architectId}`, architect);
  }

  deleteArchitect(architectId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/architects/${architectId}`);
  }
}
