// Application-слой, исходящий порт.
// Порт — контракт: ядро зависит от него, а не от технологии.
import type { Stock } from '../../../domain/stock/stock.js';

export interface IStockRepository {
  getByGoodId(goodId: string): Promise<Stock | null>;
  save(stock: Stock): Promise<void>;
}

// DI-токен: интерфейсы стираются при компиляции, Nest ищет реализацию по токену.
export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
