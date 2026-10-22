// Application-слой: «не найдено» — это не бизнес-правило, а результат поиска в хранилище,
// поэтому ошибка живёт здесь, а не в домене. HTTP-код 404 ей назначает входящий адаптер.
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
