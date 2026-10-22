// Application-слой: use case «Добавить адрес доставки» (слайд 22).
// Прикладная логика — КАК (слайд 25): восстановить → вызвать домен → сохранить.
// Про @Injectable/@Inject в application-слое см. CheckoutBasketUseCase
import { Inject, Injectable } from '@nestjs/common';
import { Address } from '../../domain/basket/address.js';
import type { Basket } from '../../domain/basket/basket.js';
import { NotFoundError } from '../not-found.error.js';
import type {
  AddDeliveryAddressCommand,
  IAddDeliveryAddress,
} from '../ports/in/add-delivery-address.port.js';
import { BASKET_REPOSITORY, type IBasketRepository } from '../ports/out/basket-repository.port.js';

@Injectable()
export class AddDeliveryAddressUseCase implements IAddDeliveryAddress {
  constructor(@Inject(BASKET_REPOSITORY) private readonly basketRepository: IBasketRepository) {}

  async execute(command: AddDeliveryAddressCommand): Promise<Basket> {
    // 1. Восстановить агрегат.
    const basket = await this.basketRepository.getByBuyerId(command.buyerId);
    if (!basket) {
      throw new NotFoundError(`Корзина покупателя ${command.buyerId} не найдена`);
    }

    // 2. Вызвать домен. Валидацию адреса выполняет сам Value Object в конструкторе.
    const address = new Address(
      command.country,
      command.city,
      command.street,
      command.house,
      command.apartment,
    );
    basket.addAddress(address);

    // 3. Сохранить. Событий нет — публиковать нечего.
    await this.basketRepository.save(basket);
    return basket;
  }
}
