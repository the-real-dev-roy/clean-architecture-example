// Unit-тесты агрегата Basket.
// Ни NestJS, ни моков: домен — обычные классы, и это главное доказательство,
// что бизнес-правила изолированы от технологий.
import { describe, expect, it } from 'vitest';
import { Address } from '../src/domain/basket/address.js';
import { Basket } from '../src/domain/basket/basket.js';
import { Status } from '../src/domain/basket/status.js';
import { TimeSlot } from '../src/domain/basket/time-slot.js';
import { DomainError } from '../src/domain/domain.error.js';
import { BasketCheckedOut } from '../src/domain/events/basket-checked-out.event.js';
import { Good } from '../src/domain/good/good.js';

const kettle = () => new Good('good-1', 'Чайник', '', 2500, 10);
const grinder = () => new Good('good-2', 'Кофемолка', '', 4000, 5);
const address = () => new Address('Россия', 'Москва', 'Тверская', '1', '10');
const timeSlot = () =>
  new TimeSlot('slot-1', 'Утро', new Date('2026-11-01T09:00:00Z'), new Date('2026-11-01T12:00:00Z'));

function readyBasket(): Basket {
  const basket = Basket.create('buyer-1');
  basket.change(kettle(), 2);
  basket.addAddress(address());
  basket.addTimeSlot(timeSlot());
  return basket;
}

describe('Basket', () => {
  it('создаётся пустой со статусом Created', () => {
    const basket = Basket.create('buyer-1');
    expect(basket.items).toHaveLength(0);
    expect(basket.status).toBe(Status.Created);
    expect(basket.total).toBe(0);
  });

  describe('change', () => {
    it('добавляет новую позицию с копией данных товара', () => {
      const basket = Basket.create('buyer-1');
      basket.change(kettle(), 2);
      expect(basket.items).toHaveLength(1);
      expect(basket.items[0]).toMatchObject({ id: 'good-1', title: 'Чайник', price: 2500, quantity: 2 });
    });

    it('меняет количество существующей позиции', () => {
      const basket = Basket.create('buyer-1');
      basket.change(kettle(), 2);
      basket.change(kettle(), 5);
      expect(basket.items).toHaveLength(1);
      expect(basket.items[0].quantity).toBe(5);
    });

    it('удаляет позицию при quantity = 0', () => {
      const basket = Basket.create('buyer-1');
      basket.change(kettle(), 2);
      basket.change(kettle(), 0);
      expect(basket.items).toHaveLength(0);
    });

    it('не принимает отрицательное количество', () => {
      const basket = Basket.create('buyer-1');
      expect(() => basket.change(kettle(), -1)).toThrow(DomainError);
    });

    it('не позволяет положить больше, чем есть на складе', () => {
      const basket = Basket.create('buyer-1');
      expect(() => basket.change(kettle(), 11)).toThrow(DomainError);
    });
  });

  it('total = сумма price × quantity (слайд 25)', () => {
    const basket = Basket.create('buyer-1');
    basket.change(kettle(), 2); // 2 × 2500
    basket.change(grinder(), 1); // 1 × 4000
    expect(basket.total).toBe(9000);
  });

  describe('checkout', () => {
    it('запрещён для пустой корзины', () => {
      const basket = Basket.create('buyer-1');
      basket.addAddress(address());
      basket.addTimeSlot(timeSlot());
      expect(() => basket.checkout()).toThrow('пустую');
    });

    it('запрещён без адреса', () => {
      const basket = Basket.create('buyer-1');
      basket.change(kettle(), 1);
      basket.addTimeSlot(timeSlot());
      expect(() => basket.checkout()).toThrow('адреса');
    });

    it('запрещён без периода доставки', () => {
      const basket = Basket.create('buyer-1');
      basket.change(kettle(), 1);
      basket.addAddress(address());
      expect(() => basket.checkout()).toThrow('периода');
    });

    it('применяет скидку к сумме к оплате', () => {
      const basket = readyBasket(); // 2 × 2500 = 5000
      basket.checkout(500);
      expect(basket.total).toBe(5000);
      expect(basket.totalToPay).toBe(4500);
    });

    it('не принимает скидку больше суммы корзины и не меняет корзину', () => {
      const basket = readyBasket();
      expect(() => basket.checkout(5001)).toThrow(DomainError);
      expect(basket.discount).toBe(0);
      expect(basket.isCheckedOut).toBe(false);
    });

    it('меняет статус и регистрирует событие BasketCheckedOut', () => {
      const basket = readyBasket();
      basket.checkout(500);

      expect(basket.status).toBe(Status.CheckedOut);
      const events = basket.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BasketCheckedOut);
      expect(events[0]).toMatchObject({ basketId: basket.id, buyerId: 'buyer-1', total: 4500 });
      // pullDomainEvents очищает список
      expect(basket.pullDomainEvents()).toHaveLength(0);
    });

    it('повторное оформление запрещено', () => {
      const basket = readyBasket();
      basket.checkout();
      expect(() => basket.checkout()).toThrow('уже оформлена');
    });

    it('оформленную корзину нельзя изменить', () => {
      const basket = readyBasket();
      basket.checkout();
      expect(() => basket.change(kettle(), 1)).toThrow(DomainError);
      expect(() => basket.addAddress(address())).toThrow(DomainError);
      expect(() => basket.addTimeSlot(timeSlot())).toThrow(DomainError);
    });
  });
});

describe('Address (Value Object)', () => {
  it('сравнивается по значению', () => {
    expect(address().equals(address())).toBe(true);
    expect(address().equals(new Address('Россия', 'Москва', 'Тверская', '2'))).toBe(false);
  });

  it('не создаётся без обязательных полей', () => {
    expect(() => new Address('Россия', '', 'Тверская', '1')).toThrow(DomainError);
  });
});

describe('TimeSlot', () => {
  it('требует start < end', () => {
    const t = new Date('2026-11-01T09:00:00Z');
    expect(() => new TimeSlot('s', 'x', t, t)).toThrow(DomainError);
  });
});
