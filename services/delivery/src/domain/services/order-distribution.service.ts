// Domain-слой: Domain Service «Алгоритм распределения заказов» (слайд 30, конспект §10.6).
//
// Domain Service инкапсулирует логику предметной области, которая не относится
// ни к одному доменному объекту. Правило «отдать заказ ближайшему свободному курьеру»
// затрагивает и Заказ, и всех Курьеров сразу — оно не принадлежит ни Order, ни Courier,
// поэтому вынесено сюда.
//
// Это всё ещё домен: никаких репозиториев, HTTP и Nest. На вход — доменные объекты,
// на выход — решение.
import type { Courier } from '../courier/courier.js';
import type { Order } from '../order/order.js';

export class OrderDistributionService {
  /** Назначает заказ ближайшему свободному курьеру. Возвращает курьера или null, если свободных нет. */
  assign(order: Order, couriers: readonly Courier[]): Courier | null {
    const free = couriers.filter((courier) => courier.isFree);
    if (free.length === 0) {
      return null;
    }

    const nearest = free.reduce((best, courier) =>
      courier.location.distanceTo(order.location) < best.location.distanceTo(order.location)
        ? courier
        : best,
    );

    order.assignTo(nearest);
    nearest.takeOrder();
    return nearest;
  }
}
