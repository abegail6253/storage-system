import { ChangeDetectorRef, Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FileService } from '../file.service'; // Ensure the correct path is used
import { MatIconModule } from '@angular/material/icon';

// Define an interface for UploadedFile
interface UploadedFile {
  filename: string;
  path: string;
  uploadedAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('fileInput') fileInput: ElementRef | undefined;

  uploadedFiles: File[] = [];
  filePreviews: { file: File; preview: string | ArrayBuffer | null }[] = [];
  progress: number = 0;
  uploading: boolean = false;
  files: UploadedFile[] = [];

  isPdf(file: File): boolean {
    return file.type === 'application/pdf';
  }

  isWord(file: File): boolean {
    return file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  isExcel(file: File): boolean {
    return file.type === 'application/vnd.ms-excel' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  isZip(file: File): boolean {
    return file.type === 'application/zip' || file.name.endsWith('.zip');
  }

  // New property to track the file being uploaded
  currentUploadingIndex: number = -1;

  // New property to track file upload progress
  fileProgress: { [key: string]: number } = {};

  uploadedFileName: string = ''; // To track the uploaded file name
  uploadCompleteMessage: string = '';

  constructor(private http: HttpClient, private fileService: FileService, private cdRef: ChangeDetectorRef) {
    this.fetchUploadedFiles();
  }

  ngAfterViewInit(): void {
    // No usage chart initialization
  }

  // Update the fetchUploadedFiles method with type safety
  fetchUploadedFiles(): void {
    this.http.get<{ files: UploadedFile[] }>('http://localhost:3000/files').subscribe(
      (data) => {
        console.log(data); // Log the fetched data for debugging
        this.files = this.filterFilesUploadedToday(data.files);
        this.cdRef.detectChanges(); // Ensure change detection is called
      },
      (error) => {
        console.error('Error fetching files:', error);
      }
    );
  }

  filterFilesUploadedToday(files: UploadedFile[]): UploadedFile[] {
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
    this.uploadedFiles.push(...files); // Add new files to existing uploadedFiles
    files.forEach((file) => this.generatePreview(file)); // Generate preview for new files
    this.cdRef.detectChanges(); // Trigger change detection to update the view
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      const files: File[] = Array.from(event.dataTransfer.files);
      this.uploadedFiles.push(...files); // Add new files to existing uploadedFiles
      files.forEach((file) => this.generatePreview(file)); // Generate preview for new files
      this.cdRef.detectChanges(); // Trigger change detection to update the view
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
        this.cdRef.detectChanges();  // Update UI after preview is generated
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      this.filePreviews.push({ file, preview: 'assets/pdf-icon.png' });
      this.cdRef.detectChanges();  // Ensure the preview is updated
    } else {
      this.filePreviews.push({ file, preview: null });
      this.cdRef.detectChanges();
    }
  }

  // Upload files one by one
  uploadFiles(): void {
    if (this.uploadedFiles.length === 0) return;

    this.uploading = true;
    // Keep filePreviews intact
    this.uploadNextFile(0);  // Start with the first file
}

// Array to hold the names of all uploaded files
uploadedFileNames: string[] = [];

// Upload the next file in the queue
uploadNextFile(index: number): void {
    if (index >= this.uploadedFiles.length) {
        this.uploading = false;
        this.fetchUploadedFiles();
        this.resetUpload();
        // Optionally reset after all uploads, but leave previews intact
        
        return;
    }

    const file = this.uploadedFiles[index];
    this.fileProgress[file.name] = 0;
    this.currentUploadingIndex = index;

    // Upload the file to the server
    this.uploadFileToServer(file, index);
}

// Actual server upload logic for all files
uploadFileToServer(file: File, index: number): void {
    const formData = new FormData();
    formData.append('files', file, file.name);
    this.fileProgress[file.name] = 0;

    const startTime = Date.now();

    this.http.post('http://localhost:3000/upload', formData, {
        headers: new HttpHeaders(),
        observe: 'events',
        reportProgress: true
    }).subscribe(
        (event) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
                const progress = Math.round(100 * event.loaded / event.total);
                this.fileProgress[file.name] = progress;
                this.cdRef.detectChanges();
            } else if (event.type === HttpEventType.Response) {
                const response = event.body as { files: { filename: string }[] };
                const uploadedFileNames = response.files.map(f => f.filename) || [];
                this.uploadedFileNames.push(...uploadedFileNames);

                // Ensure a minimum display time for the progress bar
                const elapsedTime = Date.now() - startTime;
                const minimumDisplayTime = 500; // 500 ms minimum display time

                setTimeout(() => {
                    // Do not remove the file preview here; keep it visible
                    this.uploadNextFile(index + 1);
                }, Math.max(minimumDisplayTime - elapsedTime, 0));
            }
        },
        (error) => {
            console.error('Upload error:', error);
            this.uploadNextFile(index + 1); // Continue with the next file even on error
        }
    );
}


  // Reset the upload state
  resetUpload(): void {
    this.uploadedFiles = [];
    this.filePreviews = [];
    this.fileProgress = {};
    this.uploadedFileName = '';
    this.uploadCompleteMessage = '';
    this.cdRef.detectChanges();
  }
}
