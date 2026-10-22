// Domain-слой: Address — Value Object (см. слайд 29, конспект §10.5).
//
// Чем Value Object отличается от Entity:
//   - у VO нет идентичности (id). Два адреса с одинаковыми полями — это один и тот же адрес;
//   - VO сравнивают по значению (метод equals), Entity — по id;
//   - VO иммутабелен: чтобы «изменить» адрес, создают новый объект.
import { DomainError } from '../domain.error.js';

export class Address {
  constructor(
    readonly country: string,
    readonly city: string,
    readonly street: string,
    readonly house: string,
    readonly apartment: string = '',
  ) {
    // Валидация в конструкторе: невалидный адрес просто нельзя создать.
    if (!country || !city || !street || !house) {
      throw new DomainError('В адресе обязательны страна, город, улица и дом');
    }
    Object.freeze(this);
  }

  equals(other: Address): boolean {
    return (
      this.country === other.country &&
      this.city === other.city &&
      this.street === other.street &&
      this.house === other.house &&
      this.apartment === other.apartment
    );
  }
}
