// Primary Adapter (часть HTTP-адаптера): переводит ошибки ядра в HTTP-статусы.
import { Catch, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { NotFoundError } from '../../../application/not-found.error.js';
import { DomainError } from '../../../domain/domain.error.js';

type HttpRequest = { method: string; url: string };
type JsonResponse = { status(code: number): { json(body: unknown): void } };

@Catch(DomainError, NotFoundError)
export class ErrorsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(error: DomainError | NotFoundError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const { method, url } = http.getRequest<HttpRequest>();
    const status = error instanceof NotFoundError ? 404 : 400;
    this.logger.warn(`← ${status} ${method} ${url}: ${error.name} «${error.message}»`);
    http.getResponse<JsonResponse>().status(status).json({ error: error.message });
  }
}
