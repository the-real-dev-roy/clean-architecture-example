// Primary (driving) Adapter: HTTP Handler для Backoffice (слайд 20). Вызывает входящий порт IChangeStock.
// Бизнес-логики в контроллере нет: распарсить запрос → вызвать use case → вернуть ответ.
import { Body, Controller, Inject, Param, Put, UseInterceptors } from '@nestjs/common';
import type { IChangeStock } from '../../../application/ports/in/change-stock.port.js';
import { ChangeStockUseCase } from '../../../application/use-cases/change-stock.use-case.js';
import { HttpLoggingInterceptor } from './http-logging.interceptor.js';

@Controller('stocks')
@UseInterceptors(HttpLoggingInterceptor)
export class StockController {
  constructor(@Inject(ChangeStockUseCase) private readonly changeStock: IChangeStock) {}

  @Put(':goodId')
  async change(@Param('goodId') goodId: string, @Body() body: { quantity: number }) {
    const stock = await this.changeStock.execute({ goodId, quantity: Number(body.quantity) });
    return { goodId: stock.goodId, quantity: stock.quantity };
  }
}
