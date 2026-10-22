// Primary (driving) Adapter: Kafka Consumer (конспект §7.1). Вызывает входящий порт IUpdateGoodStock.
//
// HTTP-контроллер и этот консьюмер — два разных Primary Adapter, вызывающих одно ядро.
// Use case не знает, откуда пришёл вызов.
//
// ИМИТАЦИЯ. В проде здесь был бы kafkajs (consumer.run) или @EventPattern('warehouse.stock-changed')
// из @nestjs/microservices. Для демо «сообщение из топика» приходит HTTP-POST'ом
// на POST /dev/events/stock-changed — его отправляет имитация продюсера в warehouse.
import { Body, Controller, HttpCode, Inject, Logger, Post } from '@nestjs/common';
import type { IUpdateGoodStock } from '../../../application/ports/in/update-good-stock.port.js';
import { UpdateGoodStockUseCase } from '../../../application/use-cases/update-good-stock.use-case.js';
import type { StockChangedMessage } from './stock-changed.message.js';

@Controller('dev/events')
export class StockChangedConsumer {
  private readonly logger = new Logger(StockChangedConsumer.name);

  constructor(@Inject(UpdateGoodStockUseCase) private readonly updateGoodStock: IUpdateGoodStock) {}

  @Post('stock-changed')
  @HttpCode(200)
  async handle(@Body() message: StockChangedMessage) {
    this.logger.log(`[Kafka] получено topic=warehouse.stock-changed payload=${JSON.stringify(message)}`);
    const good = await this.updateGoodStock.execute({ goodId: message.goodId, stock: message.quantity });
    this.logger.log(`Остаток товара ${good.id} обновлён: ${good.stock} шт.`);
    return { goodId: good.id, stock: good.stock };
  }
}
