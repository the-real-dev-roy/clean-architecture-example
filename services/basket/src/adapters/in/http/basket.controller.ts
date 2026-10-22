// Primary (driving) Adapter: HTTP Handler (конспект §7.1). Вызывает входящие порты — use cases покупателя.
//
// В контроллере нет бизнес-логики. Его работа: распарсить запрос → вызвать use case → вернуть ответ.
// Все правила («нельзя оформить пустую корзину» и т. п.) живут в домене.
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, UseInterceptors } from '@nestjs/common';
import type { IAddDeliveryAddress } from '../../../application/ports/in/add-delivery-address.port.js';
import type { IAddDeliveryTimeSlot } from '../../../application/ports/in/add-delivery-time-slot.port.js';
import type { IChangeBasketItems } from '../../../application/ports/in/change-basket-items.port.js';
import type { ICheckoutBasket } from '../../../application/ports/in/checkout-basket.port.js';
import type { IGetBasket } from '../../../application/ports/in/get-basket.port.js';
import { AddDeliveryAddressUseCase } from '../../../application/use-cases/add-delivery-address.use-case.js';
import { AddDeliveryTimeSlotUseCase } from '../../../application/use-cases/add-delivery-time-slot.use-case.js';
import { ChangeBasketItemsUseCase } from '../../../application/use-cases/change-basket-items.use-case.js';
import { CheckoutBasketUseCase } from '../../../application/use-cases/checkout-basket.use-case.js';
import { GetBasketUseCase } from '../../../application/use-cases/get-basket.use-case.js';
import type { Basket } from '../../../domain/basket/basket.js';
import { HttpLoggingInterceptor } from './http-logging.interceptor.js';

type ChangeItemsBody = { goodId: string; quantity: number };
type AddressBody = { country: string; city: string; street: string; house: string; apartment?: string };
type TimeSlotBody = { id: string; name: string; start: string; end: string };

@Controller('baskets/:buyerId')
@UseInterceptors(HttpLoggingInterceptor)
export class BasketController {
  // Класс use case служит только DI-токеном, а тип поля — входящий порт.
  // Контроллер видит лишь контракт сценария, а не его реализацию.
  constructor(
    @Inject(GetBasketUseCase) private readonly getBasket: IGetBasket,
    @Inject(ChangeBasketItemsUseCase) private readonly changeBasketItems: IChangeBasketItems,
    @Inject(AddDeliveryAddressUseCase) private readonly addDeliveryAddress: IAddDeliveryAddress,
    @Inject(AddDeliveryTimeSlotUseCase) private readonly addDeliveryTimeSlot: IAddDeliveryTimeSlot,
    @Inject(CheckoutBasketUseCase) private readonly checkoutBasket: ICheckoutBasket,
  ) {}

  @Get()
  async get(@Param('buyerId') buyerId: string) {
    return toResponse(await this.getBasket.execute(buyerId));
  }

  @Put('items')
  async changeItems(@Param('buyerId') buyerId: string, @Body() body: ChangeItemsBody) {
    const basket = await this.changeBasketItems.execute({
      buyerId,
      goodId: body.goodId,
      quantity: Number(body.quantity),
    });
    return toResponse(basket);
  }

  @Put('address')
  async addAddress(@Param('buyerId') buyerId: string, @Body() body: AddressBody) {
    return toResponse(await this.addDeliveryAddress.execute({ buyerId, ...body }));
  }

  @Put('time-slot')
  async addTimeSlot(@Param('buyerId') buyerId: string, @Body() body: TimeSlotBody) {
    // Разбор строк в Date — забота адаптера: ядро работает с типами предметной области.
    const basket = await this.addDeliveryTimeSlot.execute({
      buyerId,
      id: body.id,
      name: body.name,
      start: new Date(body.start),
      end: new Date(body.end),
    });
    return toResponse(basket);
  }

  @Post('checkout')
  @HttpCode(200)
  async checkout(@Param('buyerId') buyerId: string) {
    return toResponse(await this.checkoutBasket.execute(buyerId));
  }
}

// Формат ответа API — тоже деталь адаптера. Домен не подстраивается под JSON.
function toResponse(basket: Basket) {
  return {
    id: basket.id,
    buyerId: basket.buyerId,
    status: basket.status.name,
    items: basket.items.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
    })),
    address: basket.address,
    timeSlot: basket.timeSlot,
    total: basket.total,
    discount: basket.discount,
    totalToPay: basket.totalToPay,
  };
}
