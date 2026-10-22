// Application-слой: use case «Оформить корзину» (слайд 22).
// Прикладная логика — КАК приложение выполняет сценарий (слайд 25, конспект §10.1).
import { Inject, Injectable } from '@nestjs/common';
import type { Basket } from '../../domain/basket/basket.js';
import { NotFoundError } from '../not-found.error.js';
import type { ICheckoutBasket } from '../ports/in/checkout-basket.port.js';
import { BASKET_REPOSITORY, type IBasketRepository } from '../ports/out/basket-repository.port.js';
import { BUS_PRODUCER, type IBusProducer } from '../ports/out/bus-producer.port.js';
import { DISCOUNT_CLIENT, type IDiscountClient } from '../ports/out/discount-client.port.js';

/**
 * КОМПРОМИСС: декораторы NestJS в application-слое.
 *
 * 1. Что формально нарушается.
 *    Правило зависимостей (слайд 10, конспект §5): зависимости идут только снаружи внутрь.
 *    А здесь внутренний слой (Use Cases) импортирует `@nestjs/common` — пакет из внешнего
 *    кольца Frameworks and Drivers.
 *
 * 2. Почему это приемлемо.
 *    - `@Injectable` и `@Inject` — только метаданные для DI-контейнера. Бизнес-логика
 *      от Nest не зависит: в методе execute нет ни одного вызова фреймворка.
 *    - Use case по-прежнему создаётся без контейнера:
 *      `new CheckoutBasketUseCase(fakeRepo, fakeDiscount, fakeBus)` — см. unit-тест
 *      test/checkout-basket.use-case.spec.ts.
 *    - Use case зависит от ПОРТОВ (IBasketRepository, IDiscountClient, IBusProducer),
 *      а не от конкретных адаптеров. Главная цель — заменяемость технологий — достигнута.
 *    - Строгий вариант (use cases без декораторов, связывание через `useFactory`) даёт
 *      много шаблонного кода ради чистоты, которая на практике редко окупается:
 *      фреймворк меняют намного реже, чем БД или брокер.
 *    - Так пишут в большинстве реальных Nest-проектов.
 *
 * 3. Где красная линия.
 *    Из Nest в application разрешены ТОЛЬКО `@Injectable` и `@Inject`.
 *    Если в use case появился `HttpException` или `Logger` из Nest, фреймворк начал проникать
 *    в логику — это уже не компромисс, а размывание границы. В домен Nest не попадает никогда.
 *    Эту линию проверяет ESLint (eslint.config.mjs, правило no-restricted-imports).
 */
@Injectable()
export class CheckoutBasketUseCase implements ICheckoutBasket {
  constructor(
    @Inject(BASKET_REPOSITORY) private readonly basketRepository: IBasketRepository,
    @Inject(DISCOUNT_CLIENT) private readonly discountClient: IDiscountClient,
    @Inject(BUS_PRODUCER) private readonly busProducer: IBusProducer,
  ) {}

  async execute(buyerId: string): Promise<Basket> {
    // 1. Восстановить агрегат из репозитория.
    const basket = await this.basketRepository.getByBuyerId(buyerId);
    if (!basket) {
      throw new NotFoundError(`Корзина покупателя ${buyerId} не найдена`);
    }

    // 2. Вызвать методы домена.
    //
    // Где граница между прикладной и доменной логикой в случае скидки:
    //   - сходить во внешний сервис Discount и получить сумму — прикладная логика (КАК):
    //     это оркестрация, домен не знает ни о каких внешних сервисах;
    //   - решить, допустима ли скидка, и пересчитать итог — доменная логика (ЧТО):
    //     поэтому скидку проверяет и применяет сам агрегат в basket.checkout(discount).
    const discount = await this.discountClient.getDiscount(basket);
    basket.checkout(discount);

    // 3. Сохранить.
    await this.basketRepository.save(basket);

    // 4. Опубликовать доменные события.
    // В продакшене save и publish должны быть атомарны — здесь нужен Transactional Outbox.
    for (const event of basket.pullDomainEvents()) {
      await this.busProducer.publish(event);
    }

    return basket;
  }
}
