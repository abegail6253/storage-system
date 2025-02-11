import { ChangeDetectorRef, Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FileService } from '../file.service'; // Ensure the correct path is used

// Define an interface for UploadedFile
interface UploadedFile {
  filename: string;
  path: string;
  uploadedAt: string;
}

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
  files: UploadedFile[] = [];

  // New property to track the file being uploaded
  currentUploadingIndex: number = -1;

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
    this.filePreviews = [];
    this.uploadNextFile(0);  // Start with the first file
  }

  // Upload the next file in the queue
  uploadedFileNames: string[] = []; // Array to hold the names of all uploaded files

  uploadNextFile(index: number): void {
    if (index >= this.uploadedFiles.length) {
      this.uploading = false;
      this.fetchUploadedFiles();  // Refresh the list of uploaded files
      this.resetUpload();  // Reset state after all files are uploaded
      return;
    }

    const file = this.uploadedFiles[index];
    const formData = new FormData();
    formData.append('files', file, file.name);  // Ensure the key 'files' matches what the backend expects
    this.fileProgress[file.name] = 0;  // Initialize file progress for the new file

    this.currentUploadingIndex = index;  // Track the index of the current file

    this.http.post('http://localhost:3000/upload', formData, {
      headers: new HttpHeaders(),
      observe: 'events',
      reportProgress: true
    }).subscribe(
      (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const progress = Math.round(100 * event.loaded / event.total);
            this.fileProgress[file.name] = progress;
            this.cdRef.detectChanges();  // Update UI for current file
          }
        } else if (event.type === HttpEventType.Response) {
          const response = event.body as { files: { filename: string }[] };  // Typing the response correctly
          console.log(`File ${file.name} uploaded successfully`);

          // Extract filenames from response
          const uploadedFileNames = response.files.map(f => f.filename) || [];
          this.uploadedFileNames.push(...uploadedFileNames);  // Store the server's response filenames

          this.filePreviews.splice(index, 1);  // Remove file preview after successful upload
          this.uploadNextFile(index + 1);  // Continue uploading the next file
        }
      },
      (error) => {
        console.error('Upload error:', error);
        this.uploadNextFile(index + 1);  // Continue uploading the next file even if there's an error
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
