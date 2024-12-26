import { AfterViewInit, Component, effect, inject, OnInit, Signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { DatabaseService, PdfDto } from './service/database.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { combineLatest, concat, interval, map, of, share, shareReplay, Subject, switchMap, take, tap, withLatestFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterModule, RouterOutlet, CommonModule, FormsModule, NgxExtendedPdfViewerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,

})
export class AppComponent implements AfterViewInit {
  title = 'pdf-viewer';
  databaseService: DatabaseService = inject(DatabaseService);

  debug: boolean = false;
  obs1 = new Subject<number>();
  obs2 = new Subject<number>();
  obs3 = new Subject<number>();
  obs4 = new Subject<number>();
  i1: number = 0;
  i2: number = 0;
  i3: number = 0;
  i4: number = 0;

  get i_1(): number { return this.i1++; }
  get i_2(): number { return this.i2++; }
  get i_3(): number { return this.i3++; }
  get i_4(): number { return this.i4++; }

  constructor() {
    this.obs1.subscribe((value) => console.log("Observer 1: " + value));
    this.obs2.subscribe((value) => console.log("Observer 2: " + value));
    this.obs3.subscribe((value) => console.log("Observer 3: " + value));
    this.obs4.subscribe((value) => console.log("Observer 4: " + value));
    // concat([
    //   this.obs1,
    //   this.obs2
    // ]).pipe(
    //   tap((value) => console.log('atp' + value)),
    // )

    // this.obs1.pipe(switchMap((value) => {
    //   console.log("Switchmap");
    //   console.log(value);
    //   return this.obs2;
    // }))
    // .subscribe((value) => {
    //   console.log("Switchmap subscribe");
    //   console.log(value);
    // });
  }

  ngAfterViewInit(): void {
  }

  public onIncrement(): void {
    console.log("Increment first");
    this.databaseService.incrementSequence$.next();
  }

  public async reset(): Promise<void> {
    await this.databaseService.reset();
  }

}
