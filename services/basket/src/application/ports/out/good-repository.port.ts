// Application-слой, исходящий порт (см. слайд 21, конспект §9).
// Порт — контракт: ядро зависит от него, а не от технологии.
import type { Good } from '../../../domain/good/good.js';

export interface IGoodRepository {
  getById(id: string): Promise<Good | null>;
  save(good: Good): Promise<void>;
}

export const GOOD_REPOSITORY = Symbol('GOOD_REPOSITORY');
