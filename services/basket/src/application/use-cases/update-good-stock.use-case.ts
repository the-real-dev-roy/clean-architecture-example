// Application-слой: use case «Актуализировать остатки товара», актор — Склад (слайд 22).
// Прикладная логика — КАК (слайд 25): восстановить → вызвать домен → сохранить.
// Use case не знает, что его вызвал Kafka-консьюмер: для ядра все Primary Adapters одинаковы.
// Про @Injectable/@Inject в application-слое см. CheckoutBasketUseCase
import { Inject, Injectable } from '@nestjs/common';
import type { Good } from '../../domain/good/good.js';
import { NotFoundError } from '../not-found.error.js';
import type { IUpdateGoodStock, UpdateGoodStockCommand } from '../ports/in/update-good-stock.port.js';
import { GOOD_REPOSITORY, type IGoodRepository } from '../ports/out/good-repository.port.js';

@Injectable()
export class UpdateGoodStockUseCase implements IUpdateGoodStock {
  constructor(@Inject(GOOD_REPOSITORY) private readonly goodRepository: IGoodRepository) {}

  async execute({ goodId, stock }: UpdateGoodStockCommand): Promise<Good> {
    // 1. Восстановить агрегат.
    const good = await this.goodRepository.getById(goodId);
    if (!good) {
      throw new NotFoundError(`Товар ${goodId} не найден`);
    }

    // 2. Вызвать домен.
    good.updateStock(stock);

    // 3. Сохранить. Событий нет — публиковать нечего.
    await this.goodRepository.save(good);
    return good;
  }
}
