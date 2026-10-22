// Application-слой, исходящий порт.
// Порт — контракт: ядро зависит от него, а не от технологии.
import type { Courier } from '../../../domain/courier/courier.js';

export interface ICourierRepository {
  getAll(): Promise<Courier[]>;
  save(courier: Courier): Promise<void>;
}

// DI-токен: интерфейсы стираются при компиляции, Nest ищет реализацию по токену.
export const COURIER_REPOSITORY = Symbol('COURIER_REPOSITORY');
