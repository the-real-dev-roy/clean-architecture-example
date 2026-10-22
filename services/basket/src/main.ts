// Точка запуска процесса (внешнее кольцо Frameworks and Drivers): поднимает Nest и HTTP-сервер.
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ErrorsFilter } from './adapters/in/http/errors.filter.js';
import { BasketModule } from './basket.module.js';

const port = Number(process.env.PORT ?? 3001);
const app = await NestFactory.create(BasketModule);
app.useGlobalFilters(new ErrorsFilter());
await app.listen(port);
Logger.log(`basket слушает http://localhost:${port} (BASKET_STORAGE=${process.env.BASKET_STORAGE ?? 'memory'})`);
