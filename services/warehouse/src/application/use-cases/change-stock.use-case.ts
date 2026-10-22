// Application-слой: use case «Изменить остаток».
// Прикладная логика — КАК (слайд 25): восстановить → вызвать домен → сохранить → опубликовать.
// Про @Injectable/@Inject в application-слое см. CheckoutBasketUseCase (сервис basket)
import { Inject, Injectable } from '@nestjs/common';
import type { Stock } from '../../domain/stock/stock.js';
import { NotFoundError } from '../not-found.error.js';
import type { ChangeStockCommand, IChangeStock } from '../ports/in/change-stock.port.js';
import { BUS_PRODUCER, type IBusProducer } from '../ports/out/bus-producer.port.js';
import { STOCK_REPOSITORY, type IStockRepository } from '../ports/out/stock-repository.port.js';

@Injectable()
export class ChangeStockUseCase implements IChangeStock {
  constructor(
    @Inject(STOCK_REPOSITORY) private readonly stockRepository: IStockRepository,
    @Inject(BUS_PRODUCER) private readonly busProducer: IBusProducer,
  ) {}

  async execute({ goodId, quantity }: ChangeStockCommand): Promise<Stock> {
    // 1. Восстановить агрегат.
    const stock = await this.stockRepository.getByGoodId(goodId);
    if (!stock) {
      throw new NotFoundError(`Остаток товара ${goodId} не найден`);
    }

    // 2. Вызвать домен.
    stock.change(quantity);

    // 3. Сохранить.
    await this.stockRepository.save(stock);

    // 4. Опубликовать события. В продакшене здесь нужен Transactional Outbox.
    for (const event of stock.pullDomainEvents()) {
      await this.busProducer.publish(event);
    }
    return stock;
  }
}
