// Application-слой, входящий порт: use case «Оформить корзину» (слайд 22).
// Порт — контракт: Primary Adapter зависит от него, а не от реализации.
import type { Basket } from '../../../domain/basket/basket.js';

export interface ICheckoutBasket {
  execute(buyerId: string): Promise<Basket>;
}
