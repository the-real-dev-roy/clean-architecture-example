// Unit-тест CheckoutBasketUseCase с фейковыми реализациями портов.
//
// Use case создаётся обычным `new`, без Test.createTestingModule.
// Декораторы Nest не мешают тестировать use case изолированно — это и есть аргумент,
// почему компромисс «@Injectable/@Inject в application-слое» приемлем.
import { beforeEach, describe, expect, it } from 'vitest';
import type { IBasketRepository } from '../src/application/ports/out/basket-repository.port.js';
import type { IBusProducer } from '../src/application/ports/out/bus-producer.port.js';
import type { IDiscountClient } from '../src/application/ports/out/discount-client.port.js';
import { CheckoutBasketUseCase } from '../src/application/use-cases/checkout-basket.use-case.js';
import { Address } from '../src/domain/basket/address.js';
import { Basket } from '../src/domain/basket/basket.js';
import { TimeSlot } from '../src/domain/basket/time-slot.js';
import { BasketCheckedOut } from '../src/domain/events/basket-checked-out.event.js';
import type { DomainEvent } from '../src/domain/events/domain-event.js';
import { Good } from '../src/domain/good/good.js';

// Фейки — рукописные классы, реализующие порты. Никаких jest/vitest-моков:
// так видно, что порт — это просто интерфейс, который легко реализовать.
class FakeBasketRepository implements IBasketRepository {
  saved: Basket[] = [];
  constructor(private readonly basket: Basket | null) {}
  async getById() {
    return this.basket;
  }
  async getByBuyerId() {
    return this.basket;
  }
  async save(basket: Basket) {
    this.saved.push(basket);
  }
}

class FakeDiscountClient implements IDiscountClient {
  constructor(private readonly discount: number) {}
  async getDiscount() {
    return this.discount;
  }
}

class FakeBusProducer implements IBusProducer {
  published: DomainEvent[] = [];
  async publish(event: DomainEvent) {
    this.published.push(event);
  }
}

describe('CheckoutBasketUseCase', () => {
  let basket: Basket;

  beforeEach(() => {
    basket = Basket.create('buyer-1');
    basket.change(new Good('good-1', 'Чайник', '', 2500, 10), 4); // 10 000 ₽
    basket.addAddress(new Address('Россия', 'Москва', 'Тверская', '1'));
    basket.addTimeSlot(
      new TimeSlot('slot-1', 'Утро', new Date('2026-11-01T09:00:00Z'), new Date('2026-11-01T12:00:00Z')),
    );
  });

  it('применяет скидку, сохраняет корзину и публикует BasketCheckedOut', async () => {
    const repository = new FakeBasketRepository(basket);
    const bus = new FakeBusProducer();
    const useCase = new CheckoutBasketUseCase(repository, new FakeDiscountClient(1000), bus);

    const result = await useCase.execute('buyer-1');

    expect(result.isCheckedOut).toBe(true);
    expect(result.totalToPay).toBe(9000);
    expect(repository.saved).toEqual([basket]);
    expect(bus.published).toHaveLength(1);
    expect(bus.published[0]).toBeInstanceOf(BasketCheckedOut);
    expect(bus.published[0]).toMatchObject({ basketId: basket.id, total: 9000 });
  });

  it('ничего не сохраняет и не публикует, если доменное правило нарушено', async () => {
    const empty = Basket.create('buyer-2');
    const repository = new FakeBasketRepository(empty);
    const bus = new FakeBusProducer();
    const useCase = new CheckoutBasketUseCase(repository, new FakeDiscountClient(0), bus);

    await expect(useCase.execute('buyer-2')).rejects.toThrow('пустую');
    expect(repository.saved).toHaveLength(0);
    expect(bus.published).toHaveLength(0);
  });
});
