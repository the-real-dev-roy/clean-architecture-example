// Application-слой, исходящий порт (см. слайд 21, конспект §9).
// Порт — контракт: ядро зависит от него, а не от технологии.
// Реализации (Secondary Adapters): InMemoryBasketRepository, PostgresBasketRepository.
import type { Basket } from '../../../domain/basket/basket.js';

export interface IBasketRepository {
  getById(id: string): Promise<Basket | null>;
  /** Последняя корзина покупателя. */
  getByBuyerId(buyerId: string): Promise<Basket | null>;
  save(basket: Basket): Promise<void>;
}

// DI-токен рядом с портом — обычный Symbol, без импорта Nest.
// Нужен потому, что интерфейсы TypeScript стираются при компиляции
// и Nest не может найти реализацию по типу.
export const BASKET_REPOSITORY = Symbol('BASKET_REPOSITORY');
