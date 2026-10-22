// Composition Root сервиса basket.
//
// Это единственное место, которое знает, какая технология реализует какой порт.
// Domain и application зависят только от интерфейсов (портов) и токенов.
// Чтобы заменить PostgreSQL на Redis, меняется одна строка здесь:
//   { provide: BASKET_REPOSITORY, useClass: RedisBasketRepository }
// — и ни строчки в domain/ или application/.
import { Module } from '@nestjs/common';
import { BASKET_REPOSITORY } from './application/ports/out/basket-repository.port.js';
import { BUS_PRODUCER } from './application/ports/out/bus-producer.port.js';
import { DISCOUNT_CLIENT } from './application/ports/out/discount-client.port.js';
import { GOOD_REPOSITORY } from './application/ports/out/good-repository.port.js';
import { AddDeliveryAddressUseCase } from './application/use-cases/add-delivery-address.use-case.js';
import { AddDeliveryTimeSlotUseCase } from './application/use-cases/add-delivery-time-slot.use-case.js';
import { ChangeBasketItemsUseCase } from './application/use-cases/change-basket-items.use-case.js';
import { CheckoutBasketUseCase } from './application/use-cases/checkout-basket.use-case.js';
import { GetBasketUseCase } from './application/use-cases/get-basket.use-case.js';
import { UpdateGoodStockUseCase } from './application/use-cases/update-good-stock.use-case.js';
import { BasketController } from './adapters/in/http/basket.controller.js';
import { StockChangedConsumer } from './adapters/in/kafka/stock-changed.consumer.js';
import { GrpcDiscountClient } from './adapters/out/grpc/grpc-discount.client.js';
import { KafkaBusProducer } from './adapters/out/kafka/kafka-bus.producer.js';
import { InMemoryBasketRepository } from './adapters/out/persistence/in-memory-basket.repository.js';
import { InMemoryGoodRepository } from './adapters/out/persistence/in-memory-good.repository.js';
import { PostgresBasketRepository } from './adapters/out/persistence/postgres-basket.repository.js';

@Module({
  // Primary Adapters: два разных входа в одно ядро.
  controllers: [BasketController, StockChangedConsumer],
  providers: [
    // Use cases регистрируются просто как классы.
    ChangeBasketItemsUseCase,
    GetBasketUseCase,
    AddDeliveryAddressUseCase,
    AddDeliveryTimeSlotUseCase,
    CheckoutBasketUseCase,
    UpdateGoodStockUseCase,

    // Связывание исходящих портов с Secondary Adapters.
    // «Один порт — несколько реализаций» (слайд 19): хранилище выбирается переменной окружения.
    {
      provide: BASKET_REPOSITORY,
      useFactory: () =>
        process.env.BASKET_STORAGE === 'postgres'
          ? new PostgresBasketRepository()
          : new InMemoryBasketRepository(),
    },
    { provide: GOOD_REPOSITORY, useClass: InMemoryGoodRepository },
    { provide: DISCOUNT_CLIENT, useClass: GrpcDiscountClient },
    { provide: BUS_PRODUCER, useClass: KafkaBusProducer },
  ],
})
export class BasketModule {}
