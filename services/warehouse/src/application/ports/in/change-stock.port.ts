// Application-слой, входящий порт: use case «Изменить остаток» (актор — Backoffice).
// Порт — контракт: Primary Adapter зависит от него, а не от реализации.
import type { Stock } from '../../../domain/stock/stock.js';

export interface ChangeStockCommand {
  goodId: string;
  quantity: number;
}

export interface IChangeStock {
  execute(command: ChangeStockCommand): Promise<Stock>;
}
