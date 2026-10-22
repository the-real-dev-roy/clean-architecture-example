// Secondary (driven) Adapter: реализует исходящий порт IOrderRepository, хранит заказы в памяти.
import { Injectable, Logger } from '@nestjs/common';
import type { IOrderRepository } from '../../../application/ports/out/order-repository.port.js';
import type { Order } from '../../../domain/order/order.js';

@Injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private readonly logger = new Logger(InMemoryOrderRepository.name);
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
    const { x, y } = order.location;
    this.logger.log(
      `[Memory] save → заказ ${order.id.slice(0, 8)}, корзина ${order.basketId.slice(0, 8)}, ` +
        `точка (${x}, ${y}), курьер: ${order.courierId ?? 'не назначен'}`,
    );
  }
}
