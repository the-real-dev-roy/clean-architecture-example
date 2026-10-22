// Точка запуска процесса (внешнее кольцо Frameworks and Drivers).
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DiscountModule } from './discount.module.js';

const port = Number(process.env.PORT ?? 3002);
const app = await NestFactory.create(DiscountModule);
await app.listen(port);
Logger.log(`discount слушает http://localhost:${port}`);
