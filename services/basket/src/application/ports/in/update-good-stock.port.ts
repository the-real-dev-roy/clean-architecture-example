// Application-слой, входящий порт: use case «Актуализировать остатки товара», актор — Склад (слайд 22).
// Порт — контракт: Primary Adapter (Kafka-консьюмер) зависит от него, а не от реализации.
import type { Good } from '../../../domain/good/good.js';

export interface UpdateGoodStockCommand {
  goodId: string;
  stock: number;
}

export interface IUpdateGoodStock {
  execute(command: UpdateGoodStockCommand): Promise<Good>;
}
