import { Injectable, OnDestroy, Signal, signal, WritableSignal } from '@angular/core';
import { addRxPlugin, CollectionsOfDatabase, createRxDatabase, getRxDocumentConstructor, removeRxDatabase, RxAttachmentCreator, RxCollection, RxCollectionBase, RxDatabase, RxDatabaseBase, RxDocument, RxJsonSchema, RxQuery } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { combineLatestWith, concatMap, distinct, distinctUntilChanged, exhaustMap, map, mergeMap, scan, shareReplay, startWith, switchMap, take, takeLast, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { combineLatest, concat, EMPTY, empty, forkJoin, from, lastValueFrom, Observable, of, Subject, Subscriber } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface PdfDto {
  id: number,
  title: string;
};

export interface SequenceDto {
  id: number,
  sequence: number,
};

export interface PdfListRequest {
  lastId: number,
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService implements OnDestroy {
  database$: Observable<RxDatabase> = from(this.initDatabase())
    .pipe(
      tap(() => console.log("DATABASE INITALIZED")),
      shareReplay(1));
  collection$: Observable<RxCollection> = this.database$.pipe(switchMap((db) => {
    return of(db['pdf']);
  }));

  savePdf$: Subject<File> = new Subject<File>();
  listPdfs$: Subject<PdfListRequest> = new Subject<PdfListRequest>();
  incrementSequence$: Subject<void> = new Subject<void>();

  pdfs$!: Observable<PdfDto[]>;
  sequences$!: Observable<SequenceDto>;

  // pdfs$: Observable<RxCollection> = this.database$.pipe(switchMap((db: RxDatabase) => {
  //   return db.collections['pdf'].$;
  // }));

  database?: RxDatabase;
  sequenceCollection?: RxCollection;
  pdfCollection?: RxCollection;

  // sequenceSignal: WritableSignal<number | undefined> = signal(undefined);

  private destroy$: Subject<void> = new Subject<void>();

  sequenceSchema: RxJsonSchema<any> = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        maxLength: 10,
      },
      sequence: {
        type: 'number',
      }
    },
    required: ['id', 'sequence']
  };

  pdfSchema: RxJsonSchema<any> = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        maxLength: 100,
      },
      idNum: {
        type: 'number',
      },
      title: {
        type: 'string',
      }
    },
    attachments: {
    },
    required: ['id', 'idNum']
  };

  private pageSize: number = 2;


  private debugger(): void {
    this.database$.subscribe((db) => {
      db['pdf'].find().$.pipe(
        map((result) => {
          return result.map((v: any) => {
            return {
              id: v.idNum,
              title: v.title
            } as PdfDto;
          });
        })
      ).subscribe((value) => {
        console.log("ALL");
        console.log(value);
      });
    });
  }

  constructor() {
    // remove in prod
    addRxPlugin(RxDBDevModePlugin);
    addRxPlugin(RxDBAttachmentsPlugin);

    this.savePdf$.subscribe(() => console.log("save pdfs logger"));
    this.database$.subscribe(() => console.log("database logger"));
    this.sequence$.subscribe(() => console.log("sequence logger"));
    // this.sequences$.subscribe(() => console.log("sequences logger"));
    this.incrementSequence$.subscribe(() => console.log("increment sequence logger"));
    // this.pdfs$.subscribe((value) => console.log('pdfs logger'));

    this.savePdf$.pipe(
      takeUntil(this.destroy$),
      withLatestFrom(this.database$),
      withLatestFrom(this.sequence$),
      map(([[file, db], sequence]) => {
        return { file, db, sequence };
      }),
      tap((value) => console.log(value))
    ).subscribe((value) => {
      value.db['pdf'].insert({
        id: value.sequence.toString(),
        idNum: value.sequence,
        title: value.file.name,
      }).then(() => this.incrementSequence$.next());
    });

    // combineLatest([
    //   this.savePdf$,
    //   this.database$,
    //   this.sequence$
    // ]).pipe(
    //   tap(() => console.log("Inserting")),
    //   switchMap(([file, db, sequence]) => {
    //     return from(db['pdf'].insert({
    //       id: sequence.toString(),
    //       idNum: sequence,
    //       title: file.name,
    //     }));
    //   }),
    //   tap(() => {
    //     this.incrementSequence();
    //   }),
    //   takeUntilDestroyed())
    //   .subscribe((value) => {
    //     console.log("Savig file...");
    //   });


    combineLatest([
      this.database$,
      this.incrementSequence$,
    ]);
    this.incrementSequence$
      .pipe(
        withLatestFrom(this.database$),
        tap(() => console.log("Incrementing")),
        map(([_, db]) => db as RxDatabase),
        mergeMap((db: RxDatabase) => {
          return db['sequence'].findOne().$.pipe(take(1));
        }),
      ).subscribe((sequence: RxDocument) => {
        sequence.modify((data: any) => {
          data.sequence = data.sequence + 1;
          return data;
        }).then((valu: any) => {
          console.log('sequence incremented');
          console.log(valu._data['sequence']);
        });
      });

    this.pdfs$ =
      combineLatest([
        this.database$,
        this.listPdfs$.pipe(
          startWith({ lastId: 0 } as PdfListRequest),
          distinctUntilChanged((prev, curr) => prev.lastId === curr.lastId),
        ),
      ]).pipe(
        tap(() => console.log("Listing pdfs")),
        takeUntilDestroyed(),
        switchMap(([db, request]) => {
          return db['pdf'].find({
            sort: [
              { idNum: 'asc' }
            ],
            selector: {
              idNum: { $gt: request.lastId }
            },
            limit: this.pageSize,
          }).$.pipe(take(1));
        }),
        map((result) => {
          return result.map(v => {
            return {
              id: v.idNum,
              title: v.title
            } as PdfDto;
          });
        }),
        scan((list: PdfDto[], current: PdfDto[]) => {
          list.push(...current);
          return list;
        })
      );

    // this.savePdf$.pipe(
    //   withLatestFrom(this.database$),
    //   withLatestFrom((value) => {
    //     return this.sequence$;
    //   }),
    //   takeUntilDestroyed(),
    // )
    //   .subscribe(([file, db]) => {
    //     return of(null);
    //   });
    // const id: number | undefined = this.sequenceSignal();
    // if (!id) {
    //   throw new Error("Sequence not initialized yet.");
    // }
    // const doc: RxDocument = await collection.insert({
    //   id: id.toString(),
    //   idNum: id,
    //   title: file.name,
    // });

    // await doc.putAttachment({
    //   id: 'pdf',
    //   type: file.type,
    //   data: file,
    // });

    this.debugger();
  }

  get sequence$(): Observable<number> {
    return this.database$.pipe(
      switchMap((db: RxDatabase) => {
        return db['sequence'].findOne().$;
      }),
      switchMap((sequence: RxDocument) => {
        return sequence.get$('sequence');
      }),
    );
  };

  // get all$(): Observable<PdfDto[]> {
  //   // return this.database$.pipe(switchMap((db) => {
  //   //   return db['pdf'].findOne().$;
  //   // }));
  // }

  ngOnDestroy(): void {
    this.destroy$.complete();
    // if (this.database) {
    //   this.database.destroy();
    //   removeRxDatabase('database', getRxStorageDexie());
    // }
  };


  // public getPdfCollection(): <RxCollection> {
  // return this.pdfs$;
  // debugger;
  // if (!this.pdfCollection) {
  //   await this.initDatabase();
  // }
  // if (this.pdfCollection) {
  //   return Promise.resolve(this.pdfCollection);
  // } else {
  //   throw new Error("Failed to initialize the database.");
  // }
  // };

  //
  // CRUD
  //

  public findAll(lastId: number): Observable<PdfDto[]> {
    // return this.database$.pipe(switchMap((db) => {
    return of();
    //   return db['pdf'].find({
    //     sort: [
    //       { idNum: 'asc' }
    //     ],
    //     selector: {
    //       idNum: { $gt: lastId }
    //     },
    //     // limit: this.pageSize,
    //   }).$;
    // }));

    // console.log("FindAll: " + lastId);
    // const collection: RxCollection = await this.getPdfCollection();
    // const result = await collection.find({
    //   sort: [
    //     { idNum: 'asc' }
    //   ],
    //   selector: {
    //     idNum: { $gt: lastId }
    //   },
    //   limit: this.pageSize,
    //   // skip: this.pageSize,
    // }).exec();

    // return result.map((value) => {
    //   return {
    //     id: value.idNum,
    //     title: value.title,
    //   } as PdfDto;
    // });
  }

  public async delete(id: number): Promise<void> {
    console.log("Deleting in db: " + id);
    const collection: RxCollection = await lastValueFrom(this.collection$);
    // const collection: RxCollection = await this.getPdfCollection();
    const doc = await collection.find({
      selector: {
        id: id.toString(),
      },
    });

    await doc.remove();
    console.log(doc);
  };

  //
  // CRUD END
  //

  private async createDatabase(): Promise<RxDatabase> {
    return await createRxDatabase({
      name: 'database',
      storage: getRxStorageDexie(),
    });
  }

  private async initDatabase(): Promise<RxDatabase> {
    if (!this.database) {
      console.log("Database does not exists");
      this.database = await this.createDatabase();
    }

    if (!this.database['pdf']) {
      await this.database.addCollections({
        pdf: {
          schema: this.pdfSchema
        },
      });
    }
    if (!this.database['sequence']) {
      await this.database.addCollections({
        sequence: {
          schema: this.sequenceSchema,
        }
      });
    }

    this.sequenceCollection = this.database['sequence'];
    this.pdfCollection = this.database['pdf'];
    this.initSequence();
    return this.database;
  }

  private async initSequence(): Promise<void> {
    if (this.database == null) {
      throw new Error("No database");
    }
    if (!this.sequenceCollection) {
      throw new Error("No sequence");
    }
    console.log("sequence initialization");
    const doc: RxDocument = await this.getOrInitSequence();
    // doc.get$('sequence').subscribe((data: any) => {
    // this.sequenceSignal.set(data);
    // });
    console.log(doc);
  }

  private async getOrInitSequence(): Promise<RxDocument> {
    let doc = await this.sequenceCollection!.findOne().exec();
    if (doc == null) {
      doc = this.sequenceCollection!.insert({
        id: '0',
        sequence: 0,
      });
    }
    return doc;
  }

  // public incrementSequence(): void {
  // this.incrementSequence$.next();

  // return this.database$.pipe(
  //   switchMap((db) => {
  //     return db['sequence'].findOne().$.pipe(take(1));
  //   }),
  //   switchMap((sequence: RxDocument) => {
  //     return from(sequence.incrementalModify((data: any) => {
  //       data.sequence = data.sequence + 1;
  //       return data;
  //     }));
  //   }),
  //   switchMap((sequence: any) => {
  //     return of({
  //       id: sequence.id,
  //       sequence: sequence.sequence,
  //     });
  //   })
  // );

  // if (this.database == null) {
  //   throw new Error("No database");
  // }
  // if (!this.sequenceCollection) {
  //   throw new Error("No sequence");
  // }
  // const doc = await this.sequenceCollection.findOne().exec();
  // doc.incrementalModify((data: any) => {
  //   data.sequence = data.sequence + 1;
  //   return data;
  // });
  // }

  public async savePdf(file: File): Promise<void> {

    const collection: RxCollection = await lastValueFrom(this.collection$);

    // const id: number | undefined = this.sequenceSignal();
    // if (!id) {
    //   throw new Error("Sequence not initialized yet.");
    // }
    // const doc: RxDocument = await collection.insert({
    //   id: id.toString(),
    //   idNum: id,
    //   title: file.name,
    // });

    // await doc.putAttachment({
    //   id: 'pdf',
    //   type: file.type,
    //   data: file,
    // });

    // await this.incrementSequence();
  }

  public async getPdf(id: number) {
    const pdf: RxDocument = await this.pdfCollection!.findOne({
      selector: {
        id: id.toString()
      }
    }).exec();
    const file = pdf.getAttachment('pdf');
    return file;
  }

  public count(): Observable<number> {
    return this.database$.pipe(switchMap((db) => {
      return db['pdf'].count().$;
    }));
    // return new Observable<number>((observable) => {
    //   this.getPdfCollection().then((collection) => {
    //     collection.count().$.subscribe(count => {
    //       observable.next(count);
    //     });
    //   });
    // });
  };

  // for debugging
  public async reset(): Promise<void> {
    if (this.database) {
      console.log('delete');
      const collections: CollectionsOfDatabase = this.database.collections;
      Object.keys(collections).forEach(async collection => {
        await this.database![collection].remove();
      });
      await this.database.destroy();
      await removeRxDatabase('database', getRxStorageDexie());
      await this.initDatabase();
    }
  }

}
