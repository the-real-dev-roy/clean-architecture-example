// Composition Root сервиса warehouse: единственное место, где порты связываются с адаптерами.
// Подменить реализацию = поменять useClass здесь.
import { Module } from '@nestjs/common';
import { StockController } from './adapters/in/http/stock.controller.js';
import { KafkaBusProducer } from './adapters/out/kafka/kafka-bus.producer.js';
import { InMemoryStockRepository } from './adapters/out/persistence/in-memory-stock.repository.js';
import { BUS_PRODUCER } from './application/ports/out/bus-producer.port.js';
import { STOCK_REPOSITORY } from './application/ports/out/stock-repository.port.js';
import { ChangeStockUseCase } from './application/use-cases/change-stock.use-case.js';

@Module({
  controllers: [StockController],
  providers: [
    ChangeStockUseCase,
    { provide: STOCK_REPOSITORY, useClass: InMemoryStockRepository },
    { provide: BUS_PRODUCER, useClass: KafkaBusProducer },
  ],
})
export class WarehouseModule {}
