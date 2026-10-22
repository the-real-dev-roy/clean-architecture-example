// Application-слой, входящий порт: use case «Получить состав корзины» (слайд 22).
// Порт — контракт: Primary Adapter зависит от него, а не от реализации.
import type { Basket } from '../../../domain/basket/basket.js';

export interface IGetBasket {
  execute(buyerId: string): Promise<Basket>;
}
