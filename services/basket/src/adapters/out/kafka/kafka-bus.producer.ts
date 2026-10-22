// Secondary (driven) Adapter: реализует исходящий порт IBusProducer (Kafka Producer, конспект §10.4).
//
// ИМИТАЦИЯ. Настоящего брокера нет: продюсер пишет сообщение в лог и сразу отправляет его
// HTTP-POST'ом в dev-эндпоинт сервиса-потребителя, чтобы сквозной сценарий работал без Kafka.
// В проде здесь был бы kafkajs: producer.send({ topic, messages: [{ value }] }).
import { Injectable, Logger } from '@nestjs/common';
import type { IBusProducer } from '../../../application/ports/out/bus-producer.port.js';
import type { DomainEvent } from '../../../domain/events/domain-event.js';

const DELIVERY_URL = process.env.DELIVERY_URL ?? 'http://localhost:3004';

// Какое доменное событие в какой топик уходит — знание адаптера, а не домена.
const ROUTES: Record<string, { topic: string; consumerUrl: string }> = {
  BasketCheckedOut: {
    topic: 'basket.checked-out',
    consumerUrl: `${DELIVERY_URL}/dev/events/basket-checked-out`,
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
      // С настоящим брокером сообщение дождалось бы потребителя в топике.
      this.logger.warn(`[Kafka] потребитель недоступен (${String(error)}), сообщение потеряно`);
    }
  }
}
