// Domain-слой: ошибка нарушения бизнес-правила.
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
