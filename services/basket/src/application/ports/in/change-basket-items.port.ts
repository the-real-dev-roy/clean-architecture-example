// Application-слой, входящий порт: use case «Изменить состав корзины» (слайд 22).
// Порт — контракт: Primary Adapter (HTTP-контроллер) зависит от него, а не от реализации.
import type { Basket } from '../../../domain/basket/basket.js';

export interface ChangeBasketItemsCommand {
  buyerId: string;
  goodId: string;
  quantity: number;
}

export interface IChangeBasketItems {
  execute(command: ChangeBasketItemsCommand): Promise<Basket>;
}
