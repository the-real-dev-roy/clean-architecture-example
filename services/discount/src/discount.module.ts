// Composition Root сервиса discount. Исходящих портов нет — связывать нечего,
// регистрируются только Primary Adapter и use case.
import { Module } from '@nestjs/common';
import { DiscountController } from './adapters/in/http/discount.controller.js';
import { CalculateDiscountUseCase } from './application/use-cases/calculate-discount.use-case.js';

@Module({
  controllers: [DiscountController],
  providers: [CalculateDiscountUseCase],
})
export class DiscountModule {}
