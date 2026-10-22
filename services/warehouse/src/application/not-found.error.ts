// Application-слой: «не найдено» — результат поиска в хранилище, а не бизнес-правило.
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
