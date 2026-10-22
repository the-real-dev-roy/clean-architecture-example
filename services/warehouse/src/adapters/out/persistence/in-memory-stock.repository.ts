// Secondary (driven) Adapter: реализует исходящий порт IStockRepository, хранит данные в памяти.
// У склада свои данные, независимые от каталога basket; совпадают только id товаров.
import { Injectable, Logger } from '@nestjs/common';
import type { IStockRepository } from '../../../application/ports/out/stock-repository.port.js';
import { Stock } from '../../../domain/stock/stock.js';

@Injectable()
export class InMemoryStockRepository implements IStockRepository {
  private readonly logger = new Logger(InMemoryStockRepository.name);
  private readonly stocks = new Map<string, Stock>(
    [new Stock('good-1', 10), new Stock('good-2', 5), new Stock('good-3', 20)].map((stock) => [
      stock.goodId,
      stock,
    ]),
  );

  async getByGoodId(goodId: string): Promise<Stock | null> {
    const stock = this.stocks.get(goodId) ?? null;
    this.logger.log(`[Memory] getByGoodId(${goodId}) → ${stock ? `остаток: ${stock.quantity}` : 'не найден'}`);
    return stock;
  }

  async save(stock: Stock): Promise<void> {
    this.stocks.set(stock.goodId, stock);
    this.logger.log(`[Memory] save → ${stock.goodId}, остаток: ${stock.quantity}`);
  }
}
