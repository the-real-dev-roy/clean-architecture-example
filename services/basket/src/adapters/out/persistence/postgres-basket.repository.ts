// Secondary (driven) Adapter: реализует тот же порт IBasketRepository, но для PostgreSQL.
// ЗАГЛУШКА. Нужна, чтобы показать «один порт — несколько реализаций» (слайд 19, конспект §8).
// Включается переменной окружения BASKET_STORAGE=postgres (см. basket.module.ts).
// Domain и application про этот файл не знают и при замене хранилища не меняются.
import { Injectable, Logger } from '@nestjs/common';
import type { IBasketRepository } from '../../../application/ports/out/basket-repository.port.js';
import type { Basket } from '../../../domain/basket/basket.js';

@Injectable()
export class PostgresBasketRepository implements IBasketRepository {
  private readonly logger = new Logger(PostgresBasketRepository.name);

  async getById(id: string): Promise<Basket | null> {
    // SELECT b.*, i.* FROM baskets b
    //   LEFT JOIN basket_items i ON i.basket_id = b.id
    //  WHERE b.id = $1;
    // ...затем собрать из строк агрегат Basket (маппинг таблиц → доменный объект живёт здесь, в адаптере).
    return this.notImplemented(`getById(${id})`);
  }

  async getByBuyerId(buyerId: string): Promise<Basket | null> {
    // SELECT * FROM baskets WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT 1;
    return this.notImplemented(`getByBuyerId(${buyerId})`);
  }

  async save(basket: Basket): Promise<void> {
    // BEGIN;
    // INSERT INTO baskets (id, buyer_id, status_id, address, time_slot, discount)
    //      VALUES ($1, $2, $3, $4, $5, $6)
    // ON CONFLICT (id) DO UPDATE SET status_id = EXCLUDED.status_id, ...;
    // DELETE FROM basket_items WHERE basket_id = $1;
    // INSERT INTO basket_items (basket_id, good_id, title, price, quantity) VALUES ...;
    // COMMIT;
    return this.notImplemented(`save(${basket.id})`);
  }

  private notImplemented(method: string): never {
    this.logger.error(`[Postgres] ${method}: заглушка, реального подключения к БД нет`);
    throw new Error(`NotImplemented: PostgresBasketRepository.${method}`);
  }
}
