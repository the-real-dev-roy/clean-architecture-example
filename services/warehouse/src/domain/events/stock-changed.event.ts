// Domain-слой: событие «Остаток товара изменился». Порождается агрегатом Stock.
// Его слушает сервис basket. Копия контракта лежит там же, в basket (не в общей библиотеке):
// сервисы независимы, общий код создаёт связанность.
import { DomainEvent } from './domain-event.js';

export class StockChanged implements DomainEvent {
  readonly name = 'StockChanged';
  readonly occurredAt = new Date();

  constructor(
    readonly goodId: string,
    readonly quantity: number,
  ) {}
}
