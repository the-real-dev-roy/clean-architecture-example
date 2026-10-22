// Контракт сообщения из топика warehouse.stock-changed (его публикует сервис warehouse).
//
// Этот тип намеренно ПРОДУБЛИРОВАН в warehouse и здесь, а не вынесен в общую библиотеку:
// сервисы независимы, общий код создаёт связанность. Контракт — это формат сообщения,
// а не общий импорт.
export interface StockChangedMessage {
  goodId: string;
  quantity: number;
  occurredAt: string;
}
