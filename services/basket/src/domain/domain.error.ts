// Domain-слой: ошибка нарушения бизнес-правила.
// Обычный класс без HTTP-кодов — домен не знает, что его вызывают по HTTP.
// Какой статус вернуть клиенту, решает входящий адаптер (см. adapters/in/http/errors.filter.ts).
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
