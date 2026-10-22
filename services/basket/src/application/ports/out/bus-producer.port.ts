// Application-слой, исходящий порт (см. слайд 21, конспект §9).
// Порт — контракт: ядро зависит от него, а не от технологии.
// Через него доменные события уходят наружу; реализация — Kafka Producer (конспект §10.4).
import type { DomainEvent } from '../../../domain/events/domain-event.js';

export interface IBusProducer {
  publish(event: DomainEvent): Promise<void>;
}

export const BUS_PRODUCER = Symbol('BUS_PRODUCER');
