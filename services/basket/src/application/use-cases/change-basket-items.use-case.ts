// Application-слой: use case «Изменить состав корзины» (слайд 22).
// Прикладная логика — КАК (слайд 25): восстановить → вызвать домен → сохранить.
// Про @Injectable/@Inject в application-слое см. CheckoutBasketUseCase
import { Inject, Injectable } from '@nestjs/common';
import { Basket } from '../../domain/basket/basket.js';
import { NotFoundError } from '../not-found.error.js';
import type {
  ChangeBasketItemsCommand,
  IChangeBasketItems,
} from '../ports/in/change-basket-items.port.js';
import { BASKET_REPOSITORY, type IBasketRepository } from '../ports/out/basket-repository.port.js';
import { GOOD_REPOSITORY, type IGoodRepository } from '../ports/out/good-repository.port.js';

@Injectable()
export class ChangeBasketItemsUseCase implements IChangeBasketItems {
  constructor(
    @Inject(BASKET_REPOSITORY) private readonly basketRepository: IBasketRepository,
    @Inject(GOOD_REPOSITORY) private readonly goodRepository: IGoodRepository,
  ) {}

  async execute({ buyerId, goodId, quantity }: ChangeBasketItemsCommand): Promise<Basket> {
    // 1. Восстановить агрегаты из репозиториев.
    const good = await this.goodRepository.getById(goodId);
    if (!good) {
      throw new NotFoundError(`Товар ${goodId} не найден`);
    }
    let basket = await this.basketRepository.getByBuyerId(buyerId);
    if (!basket || basket.isCheckedOut) {
      // Прежней корзины нет или она уже оформлена — начинаем новую.
      basket = Basket.create(buyerId);
    }

    // 2. Вызвать метод домена. Все правила (количество, остаток, статус) — внутри агрегата.
    basket.change(good, quantity);

    // 3. Сохранить. Шаг «опубликовать» не нужен: change() не порождает событий.
    await this.basketRepository.save(basket);
    return basket;
  }
}
