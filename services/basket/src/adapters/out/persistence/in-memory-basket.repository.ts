// Secondary (driven) Adapter: реализует исходящий порт IBasketRepository.
// Хранит корзины в памяти процесса — используется по умолчанию (BASKET_STORAGE=memory).
import { Injectable, Logger } from '@nestjs/common';
import type { IBasketRepository } from '../../../application/ports/out/basket-repository.port.js';
import type { Basket } from '../../../domain/basket/basket.js';

@Injectable()
export class InMemoryBasketRepository implements IBasketRepository {
  private readonly logger = new Logger(InMemoryBasketRepository.name);
  private readonly baskets = new Map<string, Basket>();

  async getById(id: string): Promise<Basket | null> {
    const basket = this.baskets.get(id) ?? null;
    this.logger.log(`[Memory] getById(${id}) → ${describe(basket)}`);
    return basket;
  }

  async getByBuyerId(buyerId: string): Promise<Basket | null> {
    // Новые корзины добавляются в конец Map, поэтому последняя найденная — самая свежая.
    const baskets = [...this.baskets.values()].filter((basket) => basket.buyerId === buyerId);
    const basket = baskets.at(-1) ?? null;
    this.logger.log(`[Memory] getByBuyerId(${buyerId}) → ${describe(basket)}`);
    return basket;
  }

  async save(basket: Basket): Promise<void> {
    this.baskets.set(basket.id, basket);
    this.logger.log(`[Memory] save → ${describe(basket)}`);
  }
}

function describe(basket: Basket | null): string {
  if (!basket) {
    return 'не найдена';
  }
  return (
    `корзина ${basket.id.slice(0, 8)} (${basket.status.name}, позиций: ${basket.items.length}, ` +
    `total: ${basket.total} ₽, к оплате: ${basket.totalToPay} ₽)`
  );
}
