import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private apiUrl = 'http://localhost:3000/my-files'; // URL of the backend endpoint to get files

  constructor(private http: HttpClient) {}

  // Function to get the list of files from the backend
  getFiles(token: string): Observable<any[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  getFileStats(): Observable<any> {
    return this.http.get<any>('http://localhost:3000/files');
  }

  // Function to download a specific file
  downloadFile(fileId: number): Observable<Blob> {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const downloadUrl = `http://localhost:3000/my-files/download/${fileId}`; // Corrected URL to match backend download route
    return this.http.get<Blob>(downloadUrl, { headers, responseType: 'blob' as 'json' }); // Ensure responseType is set to 'blob'
  }

  // Function to get the preview of a specific file (returning base64 encoded data)
  getFilePreview(fileId: string): Observable<any> {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`http://localhost:3000/preview/${fileId}`, { headers });
  }

  // Function to rename a file
  renameFile(fileId: string, newName: string): Observable<any> {
    const token = localStorage.getItem('token'); // Retrieve token from localStorage
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`); // Correct string interpolation for Authorization header
    return this.http.put(
      `http://localhost:3000/my-files/${fileId}`, // Correct URL string interpolation
      { newFileName: newName },
      { headers }
    );
  }
}
