// Domain-слой: Item — Entity «Позиция корзины» (см. слайд 29, конспект §10.5).
//
// Границы агрегатов: Item не хранит ссылку на агрегат Good, а КОПИРУЕТ нужные данные
// (название, описание, цену). Агрегат Basket остаётся самодостаточным: его можно
// загрузить, проверить и сохранить, не трогая Good. А изменение цены товара в каталоге
// не меняет молча уже собранную корзину.
import { DomainError } from '../domain.error.js';
import { Good } from '../good/good.js';

export class Item {
  private constructor(
    /** id позиции совпадает с id товара: в корзине одна позиция на товар. */
    readonly id: string,
    readonly title: string,
    readonly description: string,
    readonly price: number,
    private _quantity: number,
  ) {}

  static create(good: Good, quantity: number): Item {
    const item = new Item(good.id, good.title, good.description, good.price, 0);
    item.setQuantity(quantity);
    return item;
  }

  get quantity(): number {
    return this._quantity;
  }

  setQuantity(quantity: number): void {
    // Позиция с нулевым количеством не существует — её удаляет корзина (Basket.change).
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new DomainError('Количество в позиции должно быть целым положительным числом');
    }
    this._quantity = quantity;
  }
}
