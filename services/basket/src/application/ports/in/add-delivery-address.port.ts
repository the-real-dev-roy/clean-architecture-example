// Application-слой, входящий порт: use case «Добавить адрес доставки» (слайд 22).
// Порт — контракт: Primary Adapter зависит от него, а не от реализации.
import type { Basket } from '../../../domain/basket/basket.js';

export interface AddDeliveryAddressCommand {
  buyerId: string;
  country: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
}

export interface IAddDeliveryAddress {
  execute(command: AddDeliveryAddressCommand): Promise<Basket>;
}
