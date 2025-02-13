import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';  // <-- Import DomSanitizer
import { MatIconModule } from '@angular/material/icon';
import { ChangeDetectorRef } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';



// Define an interface for the file
interface File {
  filename: string;
  size: string | number;  // Allows both string and number
  renameMode: boolean;
  mimeType: string;
  createdAt: Date;
  path?: string;
  newName?: string;
  viewMode: string;
  searchQuery: string;
  selected?: boolean;
  
  
}



@Component({
  selector: 'app-files-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatMenuModule, MatButtonModule, MatIconModule], 
  templateUrl: './files-list.component.html',
  styleUrls: ['./files-list.component.css']
})
export class FilesListComponent implements OnInit {
  files: File[] = []; // Use the File interface for the files array
  filteredFiles: File[] = []; // Filtered list of files
  sortBy: string = 'date';  // Default sort by date
  sortOrder: string = 'desc';
  fileType: string = '';    // New property to filter by file type
  safeUrl?: SafeResourceUrl; // Make safeUrl optional or initialize with null
  searchQuery: string = ''; // Make sanitizer public
  viewMode: string = 'list';
  menu: any;
  selectAllChecked: boolean = false;
  bulkActionMode = false;
  selectedBulkAction: string = '';
  showCheckboxes: boolean = false;
  showActionsForFile: File | null = null;
  showActions: boolean = false;
  statistics = {
    totalFiles: 0,
    totalSize: 0,
    totalSizeMB: 0,
    totalSizeGB: 0 
  };

  constructor(private http: HttpClient, private sanitizer: DomSanitizer, private cd: ChangeDetectorRef) {
    this.sanitizer = sanitizer;
}

  ngOnInit() {
    this.getFiles();
    this.searchFiles();
    
  }

  toggleActions(file: File) {
    this.showActionsForFile = this.showActionsForFile === file ? null : file; // Toggle visibility of actions for the file
    this.showActions = !this.showActions; // Toggle the actions visibility
  }

  

  

  searchFiles() {
    // Apply the search filter to the list of files
    this.filteredFiles = this.files.filter(file =>
      file.filename.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // Method to fetch files from backend
  getFiles() {
    this.http.get<any>('http://localhost:3000/files').subscribe(
      (response) => {
        this.files = response.files.map((file: any) => ({
          filename: file.filename,
          size: typeof file.size === 'string' ? parseInt(file.size, 10) : file.size,
          mimeType: file.mimeType,
          createdAt: new Date(file.createdAt),
          renameMode: false,
          path: file.path,
        }));
        
        console.log('Files fetched:', this.files);  // Add this log to check files
        
        this.updateStatistics();  // Call the updateStatistics function after files are fetched
        this.applyFilters();  // Make sure filters are applied after fetching files
      },
      (error) => {
        console.error('Error fetching files:', error);
      }
    );
  }
  
  
  

  updateStatistics() {
    this.statistics.totalFiles = this.files.length;
    this.statistics.totalSize = this.files.reduce((total, file) => total + (typeof file.size === 'string' ? parseInt(file.size, 10) : file.size), 0);
    
    // Convert total size to MB
    this.statistics.totalSizeMB = parseFloat((this.statistics.totalSize / (1024 * 1024)).toFixed(2)); // Convert to MB
    
    // Convert total size to GB
    this.statistics.totalSizeGB = parseFloat((this.statistics.totalSize / (1024 * 1024 * 1024)).toFixed(2)); // Convert to GB

    this.cd.detectChanges();
    
    // Display total size in GB or MB depending on the size
    if (this.statistics.totalSizeGB >= 1) {
        console.log(`Total Size: ${this.statistics.totalSizeGB} GB`);
    } else {
        console.log(`Total Size: ${this.statistics.totalSizeMB} MB`);
    }
}

  

  // Function to toggle between list and grid view
  toggleView(view: string) {
    this.viewMode = view; // Update the view mode (list or grid)
  }

  // Function to filter and sort files
  applyFilters() {
    this.filteredFiles = this.files.filter(file => {
      if (this.fileType === 'video/*') {
        return file.mimeType.startsWith('video/');
      }
      if (this.fileType === 'application/zip') {
        return file.mimeType === 'application/zip'; // Add this condition for zip files
      }
      return this.fileType ? file.mimeType === this.fileType : true;
    });
  
    this.filteredFiles.sort((a, b) => {
      let comparison = 0;
  
      if (this.sortBy === 'date') {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      } else if (this.sortBy === 'size') {
        comparison = +a.size - +b.size;
      } else if (this.sortBy === 'type') {
        comparison = a.mimeType.localeCompare(b.mimeType);
      } else if (this.sortBy === 'name') {
        comparison = a.filename.localeCompare(b.filename);
      }
  
      // If sortOrder is 'desc', reverse the comparison result
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  isZip(file: File): boolean {
    return file.mimeType === 'application/zip';  // Check if the file is of type ZIP
  }

  // Sort files based on selected criteria
  sortFiles() {
    this.applyFilters(); // Apply filters to sort the files
  }

  // Filter files by type
  filterByType() {
    console.log('Filtering by type:', this.fileType); // Add this line to debug
    this.applyFilters(); // Apply filters based on selected file type
  }

  // Function to toggle rename mode
  toggleRenameMode(file: File) {
    file.renameMode = !file.renameMode; // Toggle the rename mode
  }  

  toggleSortOrder() {
    // Toggle the sort order between 'asc' and 'desc'
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    // After toggling, you might want to apply the sorting again
    this.sortFiles();
  }

  toggleBulkActionMode() {
    this.bulkActionMode = !this.bulkActionMode;
    // Uncheck the select all checkbox when exiting bulk action mode
    if (!this.bulkActionMode) {
      this.selectAllChecked = false;
      this.files.forEach(file => file.selected = false);
    }
  }
  selectAllFiles(event: any) {
    const checked = event.target.checked;
    this.files.forEach(file => file.selected = checked);
  }

  

  bulkDelete(selectedFiles: File[]) {
    const filenames = selectedFiles.map(file => file.filename); // Get the array of filenames
  
    // Make API call to backend with POST request and filenames in the body
    this.http.post('http://localhost:3000/files/bulk-delete', { filenames }).subscribe(
      (response: any) => {
        console.log('Files deleted successfully:', response.deletedFiles);
        this.files = this.files.filter(file => !file.selected); // Remove selected files from frontend
        this.filteredFiles = this.filteredFiles.filter(file => !file.selected); // Update filtered files
        this.updateStatistics(); // Update statistics after deletion
      },
      (error) => {
        console.error('Error deleting files:', error);
      }
    );
  }
  
  bulkDownload() {
    const selectedFiles = this.filteredFiles.filter(file => file.selected);
    selectedFiles.forEach(file => {
      this.downloadFile(file.filename); // Call your existing download logic
    });
  }

  confirmBulkDelete() {
    const selectedFiles = this.files.filter(file => file.selected);
    if (selectedFiles.length === 0) {
      alert('No files selected for deletion.');
      return;
    }
  
    const confirmDelete = confirm(`Are you sure you want to delete ${selectedFiles.length} files?`);
    if (confirmDelete) {
      this.bulkDelete(selectedFiles); // Call bulk delete method
    }
  }
  
  

  

  // Function to delete a file
  deleteFile(filename: string) {
    const confirmed = window.confirm('Are you sure you want to delete this file?');
    
    if (confirmed) {
      console.log('Deleting file:', filename);
  
      // Call the backend to delete the file
      this.http.delete(`http://localhost:3000/files/${filename}`).subscribe(
        () => {
          // Remove the file from the list if the deletion is successful
          this.files = this.files.filter(file => file.filename !== filename);
          console.log(`File ${filename} deleted successfully.`);
          
          // Update statistics and apply filters
          this.updateStatistics();
          this.applyFilters();
  
          // Trigger change detection
          this.cd.detectChanges();
        },
        (error) => {
          console.error(`Error deleting file ${filename}:`, error);
        }
      );
    } else {
      console.log('File deletion cancelled.');
    }
  }
  



  // Function to rename a file
  renameFile(oldFilename: string, newFilename: string | undefined) {
    if (!newFilename) {
      console.error('New filename cannot be empty');
      return;
    }
    
    const oldFileExtension = oldFilename.split('.').pop();
    const newFileNameWithoutExtension = newFilename.split('.').shift();
    const newFileNameWithExtension = `${newFileNameWithoutExtension}.${oldFileExtension}`;
  
    const payload = { oldFilename, newFilename: newFileNameWithExtension };
  
    this.http.put('http://localhost:3000/files/rename', payload).subscribe(
      (response) => {
        this.files = this.files.map((file: File) =>
          file.filename === oldFilename ? { ...file, filename: newFileNameWithExtension, renameMode: false } : file
        );
        
        // Update statistics and apply filters
        this.updateStatistics();
        this.applyFilters();
        
        // Trigger change detection
        this.cd.detectChanges();
      },
      (error) => {
        console.error('Error renaming file:', error);
      }
    );
  }
  

  // Function to download the file
  downloadFile(filename: string) {
    const fileUrl = `http://localhost:3000/files/download/${filename}`;

    // Trigger the file download
    this.http.get(fileUrl, { responseType: 'blob' }).subscribe(
      (response: Blob) => {
        const blob = new Blob([response]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;  // Set the download attribute to the file's name
        link.click();  // Trigger the download
      },
      (error) => {
        console.error('Error downloading file:', error);
      }
    );
  }

  // Function to format the file size
  getFormattedFileSize(size: string | number): string {
    // Convert string to number if necessary
    const fileSize = typeof size === 'string' ? parseInt(size, 10) : size;
  
    const kb = fileSize / 1024;
    const mb = kb / 1024;
  
    if (kb >= 1000) {
      return `${mb.toFixed(2)} MB`;  // Display size in MB if it's over 1000 KB
    } else if (kb >= 1) {
      return `${kb.toFixed(2)} KB`;  // Display size in KB for sizes under 1000 KB
    } else {
      return `${fileSize} bytes`;  // Return the exact byte size for very small files
    }
  }
  

  // Function to check if the file is an image for preview
  isImage(file: File): boolean {
    return file.mimeType.startsWith('image/');
  }

  // Function to get image URL for preview with sanitization
  getImageUrl(file: File): any {
    const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost:3000/uploads/${file.filename}` || '');
    console.log(sanitizedUrl);  // Log sanitized URL to the console
    return sanitizedUrl;
  }

  // Function to check if the file is a PDF for preview
  isPdf(file: File): boolean {
    return file.mimeType === 'application/pdf';
  }

  isVideo(file: File): boolean {
    return file.mimeType.startsWith('video/');
  }
  
  

  isOther(file: File): boolean {
    // Return true if the file type is not recognized as any of the above
    return !this.isPdf(file) && !this.isWord(file) && !this.isVideo(file) && !this.isImage(file);
  }

  // Function to get PDF URL for preview with sanitization
  getPdfUrl(file: File): any {
    const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost:3000/uploads/${file.filename}` || '');
    console.log(sanitizedUrl);  // Log sanitized URL to the console
    return sanitizedUrl;
  }

  // Function to check if the file is a Word document
  isWord(file: File): boolean {
    return file.mimeType === 'application/msword' || file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  // Function to get Word document URL for preview with sanitization
  getDocUrl(file: File): any {
    const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost:3000/uploads/${file.filename}` || '');
    console.log(sanitizedUrl);  // Log sanitized URL to the console
    return sanitizedUrl;
  }

  // Function to check if the file is an Excel file
  isExcel(file: File): boolean {
    return file.mimeType === 'application/vnd.ms-excel' || file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  // Function to get Excel file URL for preview with sanitization
  getExcelUrl(file: File): any {
    const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost:3000/uploads/${file.filename}` || '');
    console.log(sanitizedUrl);  // Log sanitized URL to the console
    return sanitizedUrl;
  }
  getFileIconClass(file: File): string {
    if (this.isPdf(file)) {
      return 'file-icon-pdf';
    } else if (this.isWord(file)) {
      return 'file-icon-word';
    } else if (this.isVideo(file)) {
      return 'file-icon-video';
    } else if (this.isImage(file)) {
      return 'file-icon-image';
    } else {
      return 'file-icon-other';
    }
  }
  
}
