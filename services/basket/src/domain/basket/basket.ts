// Domain-слой: Basket — корень агрегата «Корзина» (см. слайд 29, конспект §10.5).
// Здесь живёт доменная логика — ЧТО должно происходить с корзиной (слайд 25, конспект §10.1).
// Ни одного импорта фреймворков и технологий: агрегат можно создать и проверить в обычном тесте.
//
// Все изменения состава агрегата идут только через его методы — так корень агрегата
// гарантирует, что бизнес-правила не обойти снаружи.
import { DomainError } from '../domain.error.js';
import { BasketCheckedOut } from '../events/basket-checked-out.event.js';
import { DomainEvent } from '../events/domain-event.js';
import { Good } from '../good/good.js';
import { Address } from './address.js';
import { Item } from './item.js';
import { Status } from './status.js';
import { TimeSlot } from './time-slot.js';

export class Basket {
  private _items: Item[] = [];
  private _address: Address | null = null;
  private _timeSlot: TimeSlot | null = null;
  private _status: Status = Status.Created;
  private _discount = 0;

  // Агрегат только НАКАПЛИВАЕТ события и сам ничего не публикует.
  // Домен не знает о Kafka — он лишь фиксирует факт «корзина оформлена».
  // Отправить события наружу — задача use case (через порт IBusProducer).
  private domainEvents: DomainEvent[] = [];

  private constructor(
    readonly id: string,
    readonly buyerId: string,
  ) {}

  static create(buyerId: string): Basket {
    if (!buyerId) {
      throw new DomainError('У корзины должен быть покупатель');
    }
    // crypto.randomUUID — глобальная функция платформы, импорт библиотек не нужен.
    return new Basket(crypto.randomUUID(), buyerId);
  }

  get items(): readonly Item[] {
    return this._items;
  }

  get address(): Address | null {
    return this._address;
  }

  get timeSlot(): TimeSlot | null {
    return this._timeSlot;
  }

  get status(): Status {
    return this._status;
  }

  get isCheckedOut(): boolean {
    return this._status.equals(Status.CheckedOut);
  }

  // Доменная логика (слайд 25, конспект §10.1): «Если положить товар в корзину,
  // то стоимость корзины увеличится на стоимость товара с учётом его количества».
  get total(): number {
    return this._items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /** Скидка, ₽. Фиксируется в момент оформления. */
  get discount(): number {
    return this._discount;
  }

  /** Сумма к оплате с учётом скидки, ₽. */
  get totalToPay(): number {
    return this.total - this._discount;
  }

  // Доменная логика: правила изменения состава корзины.
  // Они живут в агрегате, потому что это правила предметной области: они верны
  // для любого способа вызова — из HTTP, Kafka или консольной команды.
  change(good: Good, quantity: number): void {
    this.ensureNotCheckedOut();
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new DomainError('Количество не может быть отрицательным или дробным');
    }
    if (quantity > good.stock) {
      throw new DomainError(`Нельзя положить ${quantity} шт.: на складе осталось ${good.stock}`);
    }

    const existing = this._items.find((item) => item.id === good.id);
    if (quantity === 0) {
      // Количество 0 означает «убрать товар из корзины».
      this._items = this._items.filter((item) => item.id !== good.id);
    } else if (existing) {
      existing.setQuantity(quantity);
    } else {
      this._items.push(Item.create(good, quantity));
    }
  }

  addAddress(address: Address): void {
    this.ensureNotCheckedOut();
    this._address = address;
  }

  addTimeSlot(timeSlot: TimeSlot): void {
    this.ensureNotCheckedOut();
    this._timeSlot = timeSlot;
  }

  // Доменная логика: когда корзину можно оформить и какой может быть скидка.
  // Откуда взять скидку (сервис Discount по gRPC) — прикладная логика, она в CheckoutBasketUseCase.
  // Сначала проверяются ВСЕ правила и только потом меняется состояние: если оформление
  // не удалось, корзина остаётся прежней, без «прилипшей» скидки.
  checkout(discount = 0): void {
    this.ensureNotCheckedOut();
    if (this._items.length === 0) {
      throw new DomainError('Нельзя оформить пустую корзину');
    }
    if (!this._address) {
      throw new DomainError('Нельзя оформить корзину без адреса доставки');
    }
    if (!this._timeSlot) {
      throw new DomainError('Нельзя оформить корзину без периода доставки');
    }
    if (discount < 0 || discount > this.total) {
      throw new DomainError('Скидка не может быть отрицательной или больше суммы корзины');
    }

    this._discount = discount;
    this._status = Status.CheckedOut;
    // Фиксируем факт. Публиковать его будет use case.
    this.domainEvents.push(
      new BasketCheckedOut(this.id, this.buyerId, this._address, this._timeSlot, this.totalToPay),
    );
  }

  /** Забрать накопленные события (после этого список очищается). */
  pullDomainEvents(): DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }

  // Доменное правило: оформленная корзина — это уже заказ, менять её нельзя.
  private ensureNotCheckedOut(): void {
    if (this.isCheckedOut) {
      throw new DomainError('Корзина уже оформлена — изменять её нельзя');
    }
  }
}
