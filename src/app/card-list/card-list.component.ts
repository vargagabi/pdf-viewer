import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { CardComponent } from "../card/card.component";
import { CommonModule } from '@angular/common';
import { DatabaseService, PdfDto } from '../service/database.service';
import { BehaviorSubject, filter, fromEvent, merge, mergeMap, Observable, of, startWith, Subject, Subscription, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-card-list',
  imports: [CardComponent, CommonModule],
  templateUrl: './card-list.component.html',
  styleUrl: './card-list.component.scss'
})
export class CardListComponent implements OnInit, OnDestroy {

  pdfs$!: Observable<PdfDto[]>;

  databaseService: DatabaseService = inject(DatabaseService);
  private lastId: number = 0;
  private destroy$: Subject<void> = new Subject();
  private delete: Subject<number> = new Subject();
  private requestList: Subject<number> = new Subject();
  count = this.databaseService.count();


  constructor() {
    // requesting new page 
    // this.databaseService.pdfs$
    // .pipe(filter((value) => value && value.length !== 0))
    // .subscribe((result) => {
    // this.lastId = result[result.length - 1].id;
    // console.log("Setting lastId: " + this.lastId);
    // this.pdfs.push(...result);
    // });

    // this.requestList.pipe(
    //   startWith(0),
    //   mergeMap(() => {
    //     return this.databaseService.pdfs$;
    //   }),
    //   tap((result) => {
    //     this.lastId = result[result.length - 1].id
    //     console.log("Setting lastId: " + this.lastId)
    //   })
    // ).subscribe((value) => {
    //   console.log(value);
    // });

    this.pdfs$ = this.databaseService.pdfs$.pipe(tap((value: PdfDto[]) => {
      if (value && value.length !== 0) {
        this.lastId = value[value.length - 1].id;
      }
    }));

    this.requestList.pipe(startWith(this.lastId)).subscribe((lastId) => {
      console.log("Scroll: " + lastId);
      this.databaseService.listPdfs$.next({ lastId: lastId });
    });
  }


  ngOnInit(): void {
    // replace with scroll event later
    // this.initList();
    this.delete.subscribe(() => {
      console.log('change');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.complete();
    // this.change.complete();
    // this.scroll.complete();
  }

  private resetPage(): void {
  }

  private initList() {
    // const delete$ = this.delete.pipe(tap((id) => {
    //   console.log("deleting " + id);
    //   // this.resetPage();
    // }));
    // merge(this.requestList, delete$)
    //   .pipe(
    //     tap(() => {
    //       console.log("Scroll | change");
    //     }),
    //     takeUntil(this.destroy$),
    //     startWith(() => {
    //       console.log("Starting");
    //       this.resetPage();
    //     }),
    //     mergeMap(_ => this.databaseService.findAll(this.lastId))
    //   ).subscribe({
    //     next: (data) => {
    //       if (!data || data.length == 0) {
    //         return;
    //       }
    //       this.pdfs.push(...data);
    //       this.lastId = data[data.length - 1].id;
    //     },
    //     complete: () => {
    //       console.log("list completed");
    //     }
    //   });
  }

  public onFileChanged(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log("sending file");
      this.databaseService.savePdf$.next(file);
      // this.databaseService.savePdf(file).then((_) => {
      //   console.log("saved");
      input.value = '';
      // });
    }
  }

  public onScroll(): void {
    this.requestList.next(this.lastId);
  }

  public onDelete(id: number): void {
    // const index = this.pdfs.findIndex(p => p.id === id);
    // if (index > 0) {
    //   this.pdfs.splice(index, 1);
    // }
  }

  public trackByFn(index: number, item: PdfDto) {
    return item.id;
  }
}
