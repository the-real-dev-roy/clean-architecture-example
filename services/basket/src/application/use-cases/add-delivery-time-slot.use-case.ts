// Application-слой: use case «Добавить период доставки» (слайд 22).
// Прикладная логика — КАК (слайд 25): восстановить → вызвать домен → сохранить.
// Про @Injectable/@Inject в application-слое см. CheckoutBasketUseCase
import { Inject, Injectable } from '@nestjs/common';
import type { Basket } from '../../domain/basket/basket.js';
import { TimeSlot } from '../../domain/basket/time-slot.js';
import { NotFoundError } from '../not-found.error.js';
import type {
  AddDeliveryTimeSlotCommand,
  IAddDeliveryTimeSlot,
} from '../ports/in/add-delivery-time-slot.port.js';
import { BASKET_REPOSITORY, type IBasketRepository } from '../ports/out/basket-repository.port.js';

@Injectable()
export class AddDeliveryTimeSlotUseCase implements IAddDeliveryTimeSlot {
  constructor(@Inject(BASKET_REPOSITORY) private readonly basketRepository: IBasketRepository) {}

  async execute(command: AddDeliveryTimeSlotCommand): Promise<Basket> {
    // 1. Восстановить агрегат.
    const basket = await this.basketRepository.getByBuyerId(command.buyerId);
    if (!basket) {
      throw new NotFoundError(`Корзина покупателя ${command.buyerId} не найдена`);
    }

    // 2. Вызвать домен. Правило start < end проверяет сама сущность TimeSlot.
    basket.addTimeSlot(new TimeSlot(command.id, command.name, command.start, command.end));

    // 3. Сохранить. Событий нет — публиковать нечего.
    await this.basketRepository.save(basket);
    return basket;
  }
}
