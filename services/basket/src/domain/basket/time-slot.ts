// Domain-слой: TimeSlot — Entity (см. слайд 29, конспект §10.5): у периода доставки есть id.
import { DomainError } from '../domain.error.js';

export class TimeSlot {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly start: Date,
    readonly end: Date,
  ) {
    // Бизнес-правило живёт в домене: период доставки, который заканчивается раньше,
    // чем начинается, не имеет смысла в предметной области — неважно, откуда пришли данные.
    if (!(start < end)) {
      throw new DomainError('Начало периода доставки должно быть раньше конца');
    }
  }
}
