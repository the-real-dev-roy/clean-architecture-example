// Domain-слой: доменное событие — факт, который произошёл в предметной области.
// Это просто данные. Как и куда их доставить (Kafka, RabbitMQ...), решают другие слои.
export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
}
