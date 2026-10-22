// Application-слой, входящий порт: use case «Добавить период доставки» (слайд 22).
// Порт — контракт: Primary Adapter зависит от него, а не от реализации.
import type { Basket } from '../../../domain/basket/basket.js';

export interface AddDeliveryTimeSlotCommand {
  buyerId: string;
  id: string;
  name: string;
  start: Date;
  end: Date;
}

export interface IAddDeliveryTimeSlot {
  execute(command: AddDeliveryTimeSlotCommand): Promise<Basket>;
}
