import { ChangeDetectorRef, Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpEvent } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FileService } from '../file.service'; // Ensure the correct path is used

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('fileInput') fileInput: ElementRef | undefined;

  uploadedFiles: File[] = [];
  filePreviews: { file: File; preview: string | ArrayBuffer | null }[] = [];
  progress: number = 0;
  uploading: boolean = false;
  files: { filename: string, path: string, uploadedAt: string }[] = [];

  // New property to track file upload progress
  fileProgress: { [key: string]: number } = {};

  uploadedFileName: string = ''; // To track the uploaded file name
  uploadCompleteMessage: string = ''; // To track the upload completion message

  constructor(private http: HttpClient, private fileService: FileService, private cdRef: ChangeDetectorRef) {
    this.fetchUploadedFiles();
  }

  ngAfterViewInit(): void {
    // No usage chart initialization
  }

  fetchUploadedFiles(): void {
    this.http.get<any>('http://localhost:3000/files').subscribe(
      (data: { files: { filename: string, path: string, uploadedAt: string }[] }) => {
        console.log(data); // Log the fetched data for debugging
        this.files = this.filterFilesUploadedToday(data.files);
        this.cdRef.detectChanges(); // Ensure change detection
      },
      (error) => {
        console.error('Error fetching files:', error);
      }
    );
  }

  filterFilesUploadedToday(files: { filename: string, path: string, uploadedAt: string }[]): { filename: string, path: string, uploadedAt: string }[] {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));  // Set time to 00:00:00
    const endOfToday = new Date(today.setHours(23, 59, 59, 999)); // Set time to 23:59:59

    return files.filter((file) => {
      const uploadedAt = new Date(file.uploadedAt);
      return uploadedAt >= startOfToday && uploadedAt <= endOfToday;  // Check if within today's range
    });
  }

  onFilesSelected(event: any): void {
    const files: File[] = Array.from(event.target.files);
    this.uploadedFiles.push(...files);
    files.forEach((file) => this.generatePreview(file));
    this.uploadedFileName = ''; // Reset the file name when a new file is selected
    this.uploadCompleteMessage = ''; // Reset the message
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      const files: File[] = Array.from(event.dataTransfer.files);
      this.uploadedFiles.push(...files);
      files.forEach((file) => this.generatePreview(file));
      this.uploadedFileName = ''; // Reset the file name when a new file is selected
      this.uploadCompleteMessage = ''; // Reset the message
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  generatePreview(file: File): void {
    const reader = new FileReader();
    if (file.type.startsWith('image')) {
      reader.onload = () => {
        this.filePreviews.push({ file, preview: reader.result });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      this.filePreviews.push({ file, preview: 'assets/pdf-icon.png' });
    } else {
      this.filePreviews.push({ file, preview: null });
    }
  }

  uploadFiles(): void {
    const formData = new FormData();
    this.uploadedFiles.forEach((file) => {
      formData.append('files', file, file.name);
      this.fileProgress[file.name] = 0; // Initialize progress for each file
    });
  
    this.uploading = true;
    this.filePreviews = [];
  
    this.http.post('http://localhost:3000/upload', formData, {
      headers: new HttpHeaders(),
      observe: 'events',
      reportProgress: true
    }).subscribe(
      (event: any) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              console.log(`Progress: ${progress}%`);
  
              // Update individual file progress
              if (event.body && event.body.filename) {
                const fileName = event.body.filename;
                this.fileProgress[fileName] = progress;
                console.log(`File: ${fileName}, Progress: ${progress}%`);
              } else {
                // If no filename is returned, you can use the file name from the formData itself
                this.uploadedFiles.forEach((file) => {
                  if (event.loaded && event.total) {
                    const progress = Math.round(100 * event.loaded / event.total);
                    this.fileProgress[file.name] = progress;
                    this.cdRef.detectChanges();  // Ensure progress is detected in the view
                  }
                });
              }
            }
            break;
          case HttpEventType.Response:
            const uploadedFileNames = this.uploadedFiles.map(file => file.name).join(', ');
            this.uploadedFileName = uploadedFileNames;
            this.uploadCompleteMessage = `Upload complete! Files: ${uploadedFileNames}`;
            this.fetchUploadedFiles();  // Refresh the list of uploaded files
            this.resetUpload();  // Reset upload state for future uploads
            break;
        }
      },
      (error: any) => {
        console.error('Upload failed:', error);
        this.resetUpload();  // Reset upload state in case of error
      }
    );
  }
  
  
  resetUpload(): void {
    this.uploading = false;
    this.fileProgress = {};  // Reset individual file progress
    this.uploadedFiles = [];  // Clear the uploaded files
    this.filePreviews = [];  // Clear file previews
    
    // Clear file input field if it exists
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
}
