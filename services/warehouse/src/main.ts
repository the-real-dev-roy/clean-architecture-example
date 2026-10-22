// Точка запуска процесса (внешнее кольцо Frameworks and Drivers).
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ErrorsFilter } from './adapters/in/http/errors.filter.js';
import { WarehouseModule } from './warehouse.module.js';

const port = Number(process.env.PORT ?? 3003);
const app = await NestFactory.create(WarehouseModule);
app.useGlobalFilters(new ErrorsFilter());
await app.listen(port);
Logger.log(`warehouse слушает http://localhost:${port}`);
