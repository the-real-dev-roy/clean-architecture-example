// Domain-слой: ошибка нарушения бизнес-правила. HTTP-код ей назначает входящий адаптер.
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
