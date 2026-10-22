// Точка запуска процесса (внешнее кольцо Frameworks and Drivers).
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DeliveryModule } from './delivery.module.js';

const port = Number(process.env.PORT ?? 3004);
const app = await NestFactory.create(DeliveryModule);
await app.listen(port);
Logger.log(`delivery слушает http://localhost:${port}`);
