// Secondary (driven) Adapter: реализует исходящий порт IGoodRepository.
// Каталог товаров в памяти с заранее заполненными данными.
// id товаров совпадают с id в сервисе warehouse — так события о складе находят свой товар.
import { Injectable, Logger } from '@nestjs/common';
import type { IGoodRepository } from '../../../application/ports/out/good-repository.port.js';
import { Good } from '../../../domain/good/good.js';

@Injectable()
export class InMemoryGoodRepository implements IGoodRepository {
  private readonly logger = new Logger(InMemoryGoodRepository.name);
  private readonly goods = new Map<string, Good>(
    [
      new Good('good-1', 'Чайник', 'Электрический, 1.7 л', 2500, 10),
      new Good('good-2', 'Кофемолка', 'Жерновая', 4000, 5),
      new Good('good-3', 'Френч-пресс', 'Стекло, 1 л', 1500, 20),
    ].map((good) => [good.id, good]),
  );

  async getById(id: string): Promise<Good | null> {
    const good = this.goods.get(id) ?? null;
    this.logger.log(`[Memory] getById(${id}) → ${describe(good)}`);
    return good;
  }

  async save(good: Good): Promise<void> {
    this.goods.set(good.id, good);
    this.logger.log(`[Memory] save → ${describe(good)}`);
  }
}

function describe(good: Good | null): string {
  return good ? `«${good.title}», ${good.price} ₽, остаток: ${good.stock}` : 'не найден';
}
