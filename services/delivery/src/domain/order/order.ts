// Domain-слой: Order — Entity «Заказ на доставку» (доменный объект «Заказы», слайд 30).
import { DomainError } from '../domain.error.js';
import type { Courier } from '../courier/courier.js';
import type { Location } from '../location.js';

export class Order {
  private _courierId: string | null = null;

  constructor(
    readonly id: string,
    readonly basketId: string,
    readonly address: string,
    readonly location: Location,
  ) {}

  get courierId(): string | null {
    return this._courierId;
  }

  assignTo(courier: Courier): void {
    // Доменное правило: у заказа может быть только один курьер.
    if (this._courierId) {
      throw new DomainError(`Заказ ${this.id} уже передан курьеру`);
    }
    this._courierId = courier.id;
  }
}
