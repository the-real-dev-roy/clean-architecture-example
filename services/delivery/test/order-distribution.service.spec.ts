// Unit-тест Domain Service. Как и агрегаты, он тестируется без NestJS и без моков.
import { describe, expect, it } from 'vitest';
import { Courier } from '../src/domain/courier/courier.js';
import { Location } from '../src/domain/location.js';
import { Order } from '../src/domain/order/order.js';
import { OrderDistributionService } from '../src/domain/services/order-distribution.service.js';

const order = () => new Order('order-1', 'basket-1', 'Москва, Тверская, 1', new Location(0, 0));

describe('OrderDistributionService', () => {
  const service = new OrderDistributionService();

  it('назначает заказ ближайшему свободному курьеру', () => {
    const far = new Courier('c-far', 'Далёкий', new Location(100, 100));
    const near = new Courier('c-near', 'Ближний', new Location(1, 1));
    const o = order();

    expect(service.assign(o, [far, near])).toBe(near);
    expect(o.courierId).toBe('c-near');
    expect(near.isFree).toBe(false);
    expect(far.isFree).toBe(true);
  });

  it('пропускает занятых курьеров', () => {
    const busy = new Courier('c-busy', 'Занятый', new Location(0, 0), false);
    const free = new Courier('c-free', 'Свободный', new Location(50, 50));

    expect(service.assign(order(), [busy, free])).toBe(free);
  });

  it('возвращает null, если свободных курьеров нет', () => {
    const busy = new Courier('c-busy', 'Занятый', new Location(0, 0), false);
    const o = order();

    expect(service.assign(o, [busy])).toBeNull();
    expect(o.courierId).toBeNull();
  });
});
