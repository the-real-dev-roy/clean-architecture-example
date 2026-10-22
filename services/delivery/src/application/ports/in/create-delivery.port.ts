// Application-слой, входящий порт: use case «Создать доставку».
// Порт — контракт: Primary Adapter (Kafka-консьюмер) зависит от него, а не от реализации.
import type { Courier } from '../../../domain/courier/courier.js';
import type { Order } from '../../../domain/order/order.js';

export interface CreateDeliveryCommand {
  basketId: string;
  address: string;
}

export interface CreateDeliveryResult {
  order: Order;
  courier: Courier | null;
}

export interface ICreateDelivery {
  execute(command: CreateDeliveryCommand): Promise<CreateDeliveryResult>;
}
