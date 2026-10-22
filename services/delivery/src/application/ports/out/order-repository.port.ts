// Application-слой, исходящий порт. На диаграмме — DeliveryRepository [Adapter] (слайд 20).
// Порт — контракт: ядро зависит от него, а не от технологии.
import type { Order } from '../../../domain/order/order.js';

export interface IOrderRepository {
  save(order: Order): Promise<void>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
