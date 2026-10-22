// Primary (driving) Adapter: Kafka Consumer. Вызывает входящий порт ICreateDelivery.
//
// ИМИТАЦИЯ. В проде здесь был бы kafkajs (consumer.run) или @EventPattern('basket.checked-out').
// Для демо «сообщение из топика» приходит HTTP-POST'ом на POST /dev/events/basket-checked-out —
// его отправляет имитация продюсера в basket.
import { Body, Controller, HttpCode, Inject, Logger, Post } from '@nestjs/common';
import type { ICreateDelivery } from '../../../application/ports/in/create-delivery.port.js';
import { CreateDeliveryUseCase } from '../../../application/use-cases/create-delivery.use-case.js';
import type { BasketCheckedOutMessage } from './basket-checked-out.message.js';

@Controller('dev/events')
export class BasketCheckedOutConsumer {
  private readonly logger = new Logger(BasketCheckedOutConsumer.name);

  constructor(@Inject(CreateDeliveryUseCase) private readonly createDelivery: ICreateDelivery) {}

  @Post('basket-checked-out')
  @HttpCode(200)
  async handle(@Body() message: BasketCheckedOutMessage) {
    this.logger.log(`[Kafka] получено topic=basket.checked-out payload=${JSON.stringify(message)}`);

    // Перевод формата сообщения в команду use case — работа адаптера.
    const { city, street, house, apartment } = message.address;
    const address = [city, street, house, apartment].filter(Boolean).join(', ');
    const { order, courier } = await this.createDelivery.execute({ basketId: message.basketId, address });

    this.logger.log(
      courier
        ? `Доставка создана: заказ ${order.id} (${address}) → курьер ${courier.name}`
        : `Доставка создана: заказ ${order.id} (${address}) ждёт свободного курьера`,
    );
    return { orderId: order.id, courierId: order.courierId };
  }
}
