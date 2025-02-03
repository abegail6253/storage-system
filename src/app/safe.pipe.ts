import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, type: string): SafeUrl | SafeResourceUrl {
    if (type === 'url') {
      return this.sanitizer.bypassSecurityTrustUrl(value);  // For URLs (e.g., image URLs)
    }
    if (type === 'resource') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(value);  // For resource URLs (e.g., iframe src)
    }
    // You can add more cases here if needed, such as HTML or style
    return value;  // Return the original value if no type matches
  }
}
