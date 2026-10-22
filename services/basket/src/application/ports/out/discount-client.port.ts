// Application-слой, исходящий порт (см. слайд 21, конспект §9).
// Порт — контракт: ядро зависит от него, а не от технологии.
// Ядру неважно, gRPC за ним, HTTP или константа в тесте.
import type { Basket } from '../../../domain/basket/basket.js';

export interface IDiscountClient {
  /** Размер скидки для корзины, ₽. */
  getDiscount(basket: Basket): Promise<number>;
}

export const DISCOUNT_CLIENT = Symbol('DISCOUNT_CLIENT');
