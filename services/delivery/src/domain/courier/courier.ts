// Domain-слой: Courier — Entity «Курьер» (доменный объект «Курьеры», слайд 30).
import { DomainError } from '../domain.error.js';
import type { Location } from '../location.js';

export class Courier {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly location: Location,
    private _isFree = true,
  ) {}

  get isFree(): boolean {
    return this._isFree;
  }

  takeOrder(): void {
    // Доменное правило: занятый курьер не может взять ещё один заказ.
    if (!this._isFree) {
      throw new DomainError(`Курьер ${this.name} занят`);
    }
    this._isFree = false;
  }
}
