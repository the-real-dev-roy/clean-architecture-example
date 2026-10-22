// Domain-слой: Good — отдельный агрегат «Товар» (см. слайд 29, конспект §10.5).
// Поле stock (остаток) в презентации не указано — добавлено для сценария
// «Актуализировать остатки товара» (актор — Склад).
import { DomainError } from '../domain.error.js';

export class Good {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string,
    /** Цена, ₽. */
    readonly price: number,
    private _stock: number,
  ) {}

  get stock(): number {
    return this._stock;
  }

  updateStock(stock: number): void {
    // Доменное правило: остаток — целое неотрицательное число.
    if (!Number.isInteger(stock) || stock < 0) {
      throw new DomainError('Остаток товара должен быть целым неотрицательным числом');
    }
    this._stock = stock;
  }
}
