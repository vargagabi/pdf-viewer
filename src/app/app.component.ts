import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as pdfjs from 'pdfjs-dist';
import * as PDFJSViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'pdf-viewer';

  @ViewChild('canvas')
  canvas!: ElementRef<HTMLCanvasElement>;

  width: number = 600;
  height: number = 900;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    let page: number = 1;

    // from node_modules/pdfjs-dist/build/
    // automatically copy on build?
    pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.mjs';

    const canvas: HTMLCanvasElement = this.canvas.nativeElement;
    const context: CanvasRenderingContext2D = canvas.getContext('2d')!;

    pdfjs.getDocument('A1_SD1_Wortliste_02.pdf').promise.then((pdf) => {
      pdf.getPage(page).then((page) => {
        const outputScale: number = 1.0;

        const viewport = page.getViewport({ scale: outputScale });

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        const transform: any[] | undefined = outputScale !== 1
          ? [outputScale, 0, 0, outputScale, 0, 0]
          : undefined;

        page.render({
          canvasContext: context,
          viewport: page.getViewport(viewport),
          transform: transform,
        });
      });
    });
  }
}
