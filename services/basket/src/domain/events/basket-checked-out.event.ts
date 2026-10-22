// Domain-слой: событие «Корзина оформлена». Его порождает агрегат Basket в методе checkout().
import { Address } from '../basket/address.js';
import { TimeSlot } from '../basket/time-slot.js';
import { DomainEvent } from './domain-event.js';

export class BasketCheckedOut implements DomainEvent {
  readonly name = 'BasketCheckedOut';
  readonly occurredAt = new Date();

  constructor(
    readonly basketId: string,
    readonly buyerId: string,
    readonly address: Address,
    readonly timeSlot: TimeSlot,
    /** Итоговая сумма к оплате с учётом скидки, ₽. */
    readonly total: number,
  ) {}
}
