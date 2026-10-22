// Primary Adapter (часть HTTP-адаптера): логирует входящий HTTP-запрос и ответ на него.
//
// Логирование — забота инфраструктуры, поэтому оно живёт в адаптерах, а не в use case:
// Logger из Nest в application-слое запрещён (см. CheckoutBasketUseCase в basket).
// Шаги самого use case всё равно видны в логах — их пишут исходящие адаптеры
// (репозитории, gRPC-клиент, Kafka-продюсер), которые use case вызывает через порты.
import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { tap, type Observable } from 'rxjs';

type HttpRequest = { method: string; url: string; body?: object };
type HttpResponse = { statusCode: number };

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const { method, url, body } = http.getRequest<HttpRequest>();
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const payload = body && Object.keys(body).length > 0 ? ` body=${JSON.stringify(body)}` : '';
    const startedAt = Date.now();

    this.logger.log(`→ ${method} ${url}${payload} → ${handler}`);
    // Ошибки сюда не попадают: их логирует ErrorsFilter вместе с HTTP-статусом.
    return next.handle().pipe(
      tap(() => {
        const { statusCode } = http.getResponse<HttpResponse>();
        this.logger.log(`← ${statusCode} ${method} ${url} (${Date.now() - startedAt} мс)`);
      }),
    );
  }
}
