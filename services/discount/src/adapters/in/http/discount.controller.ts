// Primary (driving) Adapter: вызывает входящий порт ICalculateDiscount.
// Играет роль gRPC-сервера — DiscountServer [Adapter] со слайда 20 (конспект §9).
// В проде здесь был бы gRPC-хендлер (@GrpcMethod('DiscountService', 'Calculate')),
// для демо — обычный HTTP. Use case при этом не изменился бы.
import { Body, Controller, HttpCode, Inject, Logger, Post } from '@nestjs/common';
import type { ICalculateDiscount } from '../../../application/ports/in/calculate-discount.port.js';
import { CalculateDiscountUseCase } from '../../../application/use-cases/calculate-discount.use-case.js';
import { DISCOUNT_PERCENT, DISCOUNT_THRESHOLD } from '../../../domain/discount-policy.js';

type CalculateRequest = { basketId?: string; total: number };

@Controller('discounts')
export class DiscountController {
  private readonly logger = new Logger(DiscountController.name);

  constructor(@Inject(CalculateDiscountUseCase) private readonly calculateDiscount: ICalculateDiscount) {}

  @Post('calculate')
  @HttpCode(200)
  async calculate(@Body() body: CalculateRequest) {
    this.logger.log(`[gRPC] → Calculate(basket=${body.basketId}, total=${body.total})`);
    const discount = await this.calculateDiscount.execute(Number(body.total));
    this.logger.log(
      `[gRPC] ← discount=${discount} ₽ (правило: ${DISCOUNT_PERCENT}% при сумме > ${DISCOUNT_THRESHOLD} ₽)`,
    );
    return { discount };
  }
}
