import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ArchitectInquiry } from '../models/architect-inquiry.model';

@Injectable({
  providedIn: 'root'
})
export class ArchitectInquiryService {
  public apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  addInquiry(inquiry: ArchitectInquiry): Observable<ArchitectInquiry> {
    return this.http.post<ArchitectInquiry>(`${this.apiUrl}/api/inquiries`, inquiry);
  }

  getAllInquiries(): Observable<ArchitectInquiry[]> {
    return this.http.get<ArchitectInquiry[]>(`${this.apiUrl}/api/inquiries`);
  }

  getInquiriesByUserId(userId: number): Observable<ArchitectInquiry[]> {
    return this.http.get<ArchitectInquiry[]>(`${this.apiUrl}/api/inquiries/user/${userId}`);
  }

  updateInquiry(inquiryId: number, inquiry: ArchitectInquiry): Observable<ArchitectInquiry> {
    return this.http.put<ArchitectInquiry>(`${this.apiUrl}/api/inquiries/${inquiryId}`, inquiry);
  }

  deleteInquiry(inquiryId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/inquiries/${inquiryId}`);
  }

  addSubInquiry(inquiryId: number, message: string): Observable<ArchitectInquiry> {
    return this.http.post<ArchitectInquiry>(`${this.apiUrl}/api/inquiries/${inquiryId}/subinquiries`, { message });
  }
}
