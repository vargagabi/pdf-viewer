import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DatabaseService, PdfDto } from '../service/database.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  private databaseService: DatabaseService = inject(DatabaseService);

  @Input() pdf!: PdfDto;
  @Output() delete: EventEmitter<number> = new EventEmitter<number>();

  get datas(): string[] {
    const values: string[] = [];
    if (this.pdf) {
      const keyValues = Object.keys(this.pdf);
      for (let key of keyValues) {
        values.push(`${key}: ${this.pdf[key as keyof PdfDto]}`);
      }
    }
    return values;
  }

  public onOpen(): void {

  }

  public onDelete(): void {
    console.log("Deleting: " + this.pdf.id);
    this.databaseService.delete(this.pdf.id)
      .then(() => {
        this.delete.emit(this.pdf.id);
      });
  }

}
