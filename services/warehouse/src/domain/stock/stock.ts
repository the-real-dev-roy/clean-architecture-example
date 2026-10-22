// Domain-слой: Stock — корень агрегата «Остаток товара на складе».
import { DomainError } from '../domain.error.js';
import { DomainEvent } from '../events/domain-event.js';
import { StockChanged } from '../events/stock-changed.event.js';

export class Stock {
  private domainEvents: DomainEvent[] = [];

  constructor(
    readonly goodId: string,
    private _quantity: number,
  ) {}

  get quantity(): number {
    return this._quantity;
  }

  change(quantity: number): void {
    // Доменное правило: остаток на складе — целое неотрицательное число.
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new DomainError('Остаток должен быть целым неотрицательным числом');
    }
    this._quantity = quantity;
    // Домен только фиксирует факт; о Kafka он не знает.
    this.domainEvents.push(new StockChanged(this.goodId, quantity));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }
}
