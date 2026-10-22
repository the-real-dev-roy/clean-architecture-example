// Контракт сообщения из топика basket.checked-out (его публикует сервис basket).
//
// Тип намеренно ПРОДУБЛИРОВАН здесь, а не импортирован из basket и не вынесен в общую
// библиотеку: сервисы независимы, общий код создаёт связанность. Delivery описывает
// только те поля, которые ему нужны.
export interface BasketCheckedOutMessage {
  basketId: string;
  buyerId: string;
  address: { country: string; city: string; street: string; house: string; apartment: string };
  timeSlot: { id: string; name: string; start: string; end: string };
  total: number;
  occurredAt: string;
}
