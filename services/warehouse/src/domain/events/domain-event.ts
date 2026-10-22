// Domain-слой: доменное событие — факт предметной области, просто данные.
export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
}
