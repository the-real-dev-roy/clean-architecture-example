// Application-слой, исходящий порт: публикация доменных событий.
// Порт — контракт: ядро зависит от него, а не от технологии.
import type { DomainEvent } from '../../../domain/events/domain-event.js';

export interface IBusProducer {
  publish(event: DomainEvent): Promise<void>;
}

export const BUS_PRODUCER = Symbol('BUS_PRODUCER');
