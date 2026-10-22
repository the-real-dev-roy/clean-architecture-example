// Application-слой: use case «Создать доставку».
// Прикладная логика — КАК (слайд 25): восстановить → вызвать домен → сохранить.
// Про @Injectable/@Inject в application-слое см. CheckoutBasketUseCase (сервис basket)
import { Inject, Injectable } from '@nestjs/common';
import { Location } from '../../domain/location.js';
import { Order } from '../../domain/order/order.js';
import { OrderDistributionService } from '../../domain/services/order-distribution.service.js';
import type {
  CreateDeliveryCommand,
  CreateDeliveryResult,
  ICreateDelivery,
} from '../ports/in/create-delivery.port.js';
import { COURIER_REPOSITORY, type ICourierRepository } from '../ports/out/courier-repository.port.js';
import { ORDER_REPOSITORY, type IOrderRepository } from '../ports/out/order-repository.port.js';

@Injectable()
export class CreateDeliveryUseCase implements ICreateDelivery {
  // Domain Service — чистый класс без зависимостей, поэтому его можно просто создать.
  private readonly distribution = new OrderDistributionService();

  constructor(
    @Inject(COURIER_REPOSITORY) private readonly courierRepository: ICourierRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository,
  ) {}

  async execute({ basketId, address }: CreateDeliveryCommand): Promise<CreateDeliveryResult> {
    // 1. Восстановить доменные объекты.
    const couriers = await this.courierRepository.getAll();
    const order = new Order(crypto.randomUUID(), basketId, address, geocode(address));

    // 2. Вызвать домен: решение принимает Domain Service.
    const courier = this.distribution.assign(order, couriers);

    // 3. Сохранить изменённые объекты.
    await this.orderRepository.save(order);
    if (courier) {
      await this.courierRepository.save(courier);
    }
    return { order, courier };
  }
}

// ЗАГЛУШКА вместо сервиса Geo (на слайде 20 Delivery ходит в него по gRPC; в демо он опущен).
// В реальном проекте здесь был бы исходящий порт IGeoClient. Координаты выводятся из
// текста адреса, чтобы разные адреса давали разные, но повторяемые точки.
function geocode(address: string): Location {
  const hash = [...address].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 10_000, 7);
  return new Location(hash % 100, Math.floor(hash / 100));
}
