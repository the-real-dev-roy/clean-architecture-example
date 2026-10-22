// Secondary (driven) Adapter: реализует исходящий порт IBusProducer (Kafka Producer).
//
// ИМИТАЦИЯ: пишет сообщение в лог и отправляет его HTTP-POST'ом в dev-эндпоинт
// потребителя (сервис basket), чтобы сценарий был сквозным без брокера.
import { Injectable, Logger } from '@nestjs/common';
import type { IBusProducer } from '../../../application/ports/out/bus-producer.port.js';
import type { DomainEvent } from '../../../domain/events/domain-event.js';

const BASKET_URL = process.env.BASKET_URL ?? 'http://localhost:3001';

const ROUTES: Record<string, { topic: string; consumerUrl: string }> = {
  StockChanged: {
    topic: 'warehouse.stock-changed',
    consumerUrl: `${BASKET_URL}/dev/events/stock-changed`,
  },
};

@Injectable()
export class KafkaBusProducer implements IBusProducer {
  private readonly logger = new Logger(KafkaBusProducer.name);

  async publish(event: DomainEvent): Promise<void> {
    const route = ROUTES[event.name];
    if (!route) {
      this.logger.warn(`[Kafka] для события ${event.name} не настроен топик`);
      return;
    }

    const payload = JSON.stringify(event);
    this.logger.log(`[Kafka] topic=${route.topic} payload=${payload}`);

    try {
      const response = await fetch(route.consumerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(2000),
      });
      this.logger.log(`[Kafka] ${route.topic}: потребитель обработал сообщение, ответ ${response.status}`);
    } catch (error) {
      this.logger.warn(`[Kafka] потребитель недоступен (${String(error)}), сообщение потеряно`);
    }
  }
}
