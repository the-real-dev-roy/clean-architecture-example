// Secondary (driven) Adapter: реализует исходящий порт ICourierRepository, хранит курьеров в памяти.
import { Injectable, Logger } from '@nestjs/common';
import type { ICourierRepository } from '../../../application/ports/out/courier-repository.port.js';
import { Courier } from '../../../domain/courier/courier.js';
import { Location } from '../../../domain/location.js';

@Injectable()
export class InMemoryCourierRepository implements ICourierRepository {
  private readonly logger = new Logger(InMemoryCourierRepository.name);
  private readonly couriers = new Map<string, Courier>(
    [
      new Courier('courier-1', 'Анна', new Location(10, 10)),
      new Courier('courier-2', 'Борис', new Location(50, 50)),
      new Courier('courier-3', 'Вера', new Location(90, 20)),
    ].map((courier) => [courier.id, courier]),
  );

  async getAll(): Promise<Courier[]> {
    const couriers = [...this.couriers.values()];
    const free = couriers.filter((courier) => courier.isFree).map((courier) => courier.name);
    this.logger.log(`[Memory] getAll → курьеров: ${couriers.length}, свободны: ${free.join(', ') || 'никто'}`);
    return couriers;
  }

  async save(courier: Courier): Promise<void> {
    this.couriers.set(courier.id, courier);
    this.logger.log(`[Memory] save → курьер ${courier.name} (${courier.isFree ? 'свободен' : 'занят'})`);
  }
}
