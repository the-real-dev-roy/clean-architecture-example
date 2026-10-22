// Secondary (driven) Adapter: реализует исходящий порт IDiscountClient.
// На диаграмме системы это DiscountClient [Adapter] (слайд 20, конспект §9).
//
// В проде здесь gRPC-клиент (сгенерированный из .proto). Для демо — HTTP-запрос через fetch.
// Ядру это неважно — оно видит только IDiscountClient.
import { Injectable, Logger } from '@nestjs/common';
import type { IDiscountClient } from '../../../application/ports/out/discount-client.port.js';
import type { Basket } from '../../../domain/basket/basket.js';

@Injectable()
export class GrpcDiscountClient implements IDiscountClient {
  private readonly logger = new Logger(GrpcDiscountClient.name);
  private readonly url = process.env.DISCOUNT_URL ?? 'http://localhost:3002';

  async getDiscount(basket: Basket): Promise<number> {
    this.logger.log(`[gRPC] → DiscountService.Calculate(total=${basket.total}) на ${this.url}`);
    try {
      const response = await fetch(`${this.url}/discounts/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basketId: basket.id, total: basket.total }),
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { discount } = (await response.json()) as { discount: number };
      this.logger.log(`[gRPC] ← DiscountService.Calculate: discount=${discount} ₽`);
      return discount;
    } catch (error) {
      // Решение адаптера: недоступность скидок не должна ломать оформление заказа.
      this.logger.warn(`[gRPC] сервис discount недоступен (${String(error)}), скидка = 0`);
      return 0;
    }
  }
}
