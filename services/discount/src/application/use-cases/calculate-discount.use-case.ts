// Application-слой: use case «Рассчитать скидку». Оркестрации почти нет —
// просто вызвать доменное правило. Исходящих портов у этого сервиса нет.
// Про @Injectable/@Inject в application-слое см. CheckoutBasketUseCase (сервис basket)
import { Injectable } from '@nestjs/common';
import { calculateDiscount } from '../../domain/discount-policy.js';
import type { ICalculateDiscount } from '../ports/in/calculate-discount.port.js';

@Injectable()
export class CalculateDiscountUseCase implements ICalculateDiscount {
  async execute(total: number): Promise<number> {
    return calculateDiscount(total);
  }
}
