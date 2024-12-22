import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, Inject, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { NgxExtendedPdfViewerModule, NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    NgxExtendedPdfViewerModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [NgxExtendedPdfViewerService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterViewInit {
  title: string = 'pdf-viewer';
  sanitizer: DomSanitizer = inject(DomSanitizer);
  pdfUrl?: SafeResourceUrl = undefined;
  pdf: Blob | string | undefined = undefined;
  isBrowser: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && typeof document !== 'undefined';
    console.log(this.isBrowser);
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.pdf = localStorage.getItem('pdf') ?? undefined;
    debugger;
  }
  
  ngAfterViewInit(): void {
  }

  public onFileChanged(event: Event): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // this.pdf = file;
      const blob = new Blob([file], { type: file.type });
      const url = URL.createObjectURL(blob);
      this.pdf = url;
      localStorage.setItem("pdf", url);
      this.pdf = localStorage.getItem('pdf') ?? undefined;
    }
  }

}
