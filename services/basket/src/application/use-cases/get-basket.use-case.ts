// Application-слой: use case «Получить состав корзины» (слайд 22).
// Сценарий только читает: восстановить агрегат и вернуть его.
// Про @Injectable/@Inject в application-слое см. CheckoutBasketUseCase
import { Inject, Injectable } from '@nestjs/common';
import type { Basket } from '../../domain/basket/basket.js';
import { NotFoundError } from '../not-found.error.js';
import type { IGetBasket } from '../ports/in/get-basket.port.js';
import { BASKET_REPOSITORY, type IBasketRepository } from '../ports/out/basket-repository.port.js';

@Injectable()
export class GetBasketUseCase implements IGetBasket {
  constructor(@Inject(BASKET_REPOSITORY) private readonly basketRepository: IBasketRepository) {}

  async execute(buyerId: string): Promise<Basket> {
    const basket = await this.basketRepository.getByBuyerId(buyerId);
    if (!basket) {
      throw new NotFoundError(`Корзина покупателя ${buyerId} не найдена`);
    }
    return basket;
  }
}
