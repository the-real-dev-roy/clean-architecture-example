// Composition Root сервиса delivery: единственное место, где порты связываются с адаптерами.
// Подменить хранилище = поменять useClass здесь.
import { Module } from '@nestjs/common';
import { BasketCheckedOutConsumer } from './adapters/in/kafka/basket-checked-out.consumer.js';
import { InMemoryCourierRepository } from './adapters/out/persistence/in-memory-courier.repository.js';
import { InMemoryOrderRepository } from './adapters/out/persistence/in-memory-order.repository.js';
import { COURIER_REPOSITORY } from './application/ports/out/courier-repository.port.js';
import { ORDER_REPOSITORY } from './application/ports/out/order-repository.port.js';
import { CreateDeliveryUseCase } from './application/use-cases/create-delivery.use-case.js';

@Module({
  controllers: [BasketCheckedOutConsumer],
  providers: [
    CreateDeliveryUseCase,
    { provide: COURIER_REPOSITORY, useClass: InMemoryCourierRepository },
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
  ],
})
export class DeliveryModule {}
