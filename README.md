# Демо-маркетплейс: Clean / Hexagonal Architecture на NestJS

Учебный пример к занятию «Архитектура приложения: Layered · Onion · Clean · Hexagonal»
(конспект — [docs/clean-architecture-presentation.md](docs/clean-architecture-presentation.md)).

## 1. Что демонстрирует проект

- **Правило зависимостей**: `adapters → application → domain`. Домен не знает ни о NestJS, ни о базах, ни о брокерах.
- **Ports & Adapters**: ядро общается с внешним миром только через собственные интерфейсы (порты). Технологии вынесены в адаптеры и заменяются без изменения ядра.
- **Domain Logic vs Application Logic** (слайд 25): ЧТО делает приложение — в агрегатах; КАК — в use cases.
- **Один порт — несколько реализаций**: `IBasketRepository` → in-memory и PostgreSQL-заглушка, выбор через env.
- **Два Primary Adapter → одно ядро**: HTTP-контроллер и Kafka-консьюмер вызывают use cases одинаково.
- **Доменные события**: агрегат фиксирует факт, use case публикует его через порт `IBusProducer`.
- **Domain Service**: алгоритм распределения заказов между курьерами (слайд 30).
- **Автоматическая проверка границ** слоёв через ESLint.

Инфраструктура (PostgreSQL, Kafka, gRPC) заменена заглушками. Приложение не «боевое», зато сквозной сценарий работает без Docker.

## 2. Схема сервисов

```
Shop (curl) ──HTTP──▶ basket :3001 ──"gRPC"──▶ discount :3002
                        │  ▲
     BasketCheckedOut   │  │   StockChanged
                        ▼  │
                     "Kafka"  (имитация: лог + HTTP-POST в dev-эндпоинт)
                        │  ▲
                        ▼  │
             delivery :3004   warehouse :3003 ◀──HTTP── Backoffice (curl)
```

Каждый сервис устроен одинаково:

```
services/<name>/src/
├── domain/            ЧТО: агрегаты, entities, value objects, события, domain services
├── application/
│   ├── ports/in/      входящие порты = интерфейсы use cases
│   ├── ports/out/     исходящие порты: IBasketRepository, IDiscountClient, IBusProducer...
│   └── use-cases/     КАК: восстановить → вызвать домен → сохранить → опубликовать
├── adapters/
│   ├── in/            Primary (driving): http/, kafka/
│   └── out/           Secondary (driven): persistence/, grpc/, kafka/
├── <name>.module.ts   Composition Root
└── main.ts
```

## 3. Понятие из презентации → файл в коде

| Понятие | Где в коде |
|---|---|
| Aggregate root | [basket/src/domain/basket/basket.ts](services/basket/src/domain/basket/basket.ts), [good/good.ts](services/basket/src/domain/good/good.ts), [warehouse … stock.ts](services/warehouse/src/domain/stock/stock.ts) |
| Value Object | [basket/src/domain/basket/address.ts](services/basket/src/domain/basket/address.ts), [delivery … location.ts](services/delivery/src/domain/location.ts) |
| Entity | [item.ts](services/basket/src/domain/basket/item.ts), [time-slot.ts](services/basket/src/domain/basket/time-slot.ts), [status.ts](services/basket/src/domain/basket/status.ts), [order.ts](services/delivery/src/domain/order/order.ts), [courier.ts](services/delivery/src/domain/courier/courier.ts) |
| Domain Event | [basket-checked-out.event.ts](services/basket/src/domain/events/basket-checked-out.event.ts), [stock-changed.event.ts](services/warehouse/src/domain/events/stock-changed.event.ts) |
| Domain Service | [order-distribution.service.ts](services/delivery/src/domain/services/order-distribution.service.ts) |
| Use Case | [basket/src/application/use-cases/](services/basket/src/application/use-cases/), главный — [checkout-basket.use-case.ts](services/basket/src/application/use-cases/checkout-basket.use-case.ts) |
| Входящий порт | [basket/src/application/ports/in/](services/basket/src/application/ports/in/) (`ICheckoutBasket`, `IChangeBasketItems`, …) |
| Исходящий порт | [basket/src/application/ports/out/](services/basket/src/application/ports/out/) (`IBasketRepository`, `IGoodRepository`, `IDiscountClient`, `IBusProducer`) |
| Primary Adapter | [basket.controller.ts](services/basket/src/adapters/in/http/basket.controller.ts) (HTTP), [stock-changed.consumer.ts](services/basket/src/adapters/in/kafka/stock-changed.consumer.ts) (Kafka), [discount.controller.ts](services/discount/src/adapters/in/http/discount.controller.ts) («gRPC-сервер») |
| Secondary Adapter | [in-memory-basket.repository.ts](services/basket/src/adapters/out/persistence/in-memory-basket.repository.ts), [postgres-basket.repository.ts](services/basket/src/adapters/out/persistence/postgres-basket.repository.ts), [grpc-discount.client.ts](services/basket/src/adapters/out/grpc/grpc-discount.client.ts), [kafka-bus.producer.ts](services/basket/src/adapters/out/kafka/kafka-bus.producer.ts) |
| Composition Root | [basket.module.ts](services/basket/src/basket.module.ts) |

## 4. Как запустить

Нужен Node.js 20+.

```bash
npm install
npm run build      # tsc во всех сервисах
npm test           # unit-тесты (vitest)
npm run lint       # в том числе проверка границ слоёв
npm run start:all  # сборка + все 4 сервиса: basket 3001, discount 3002, warehouse 3003, delivery 3004
```

Включить PostgreSQL-заглушку вместо in-memory хранилища корзин:

```bash
BASKET_STORAGE=postgres npm start -w services/basket
```

Любой запрос к корзине упадёт с `NotImplemented`, и в логе появится `[Postgres] ...`. Так видно, что ядро не изменилось, поменялся только адаптер.

## 5. Сквозной сценарий

Запустите `npm run start:all` и в другом терминале выполняйте команды по очереди, следя за логами сервисов.

**Как читать логи.** Все логи пишут только адаптеры. В application-слое `Logger` запрещён (см. раздел 6а), но шаги use case всё равно видны: каждый шаг — это вызов исходящего порта, а его реализация пишет в лог.

| Метка в логе | Кто пишет | Что означает |
|---|---|---|
| `[HTTP] → … / ← 200 …` | `HttpLoggingInterceptor`, `ErrorsFilter` (Primary Adapter) | запрос пришёл в контроллер и ответ ушёл; ошибка ядра → 400/404 |
| `[Memory] getBy… / save` | in-memory репозитории (Secondary Adapter) | use case восстановил агрегат / сохранил его |
| `[gRPC] → / ←` | `GrpcDiscountClient` и `DiscountController` | синхронный вызов Basket → Discount |
| `[Kafka] topic=… / получено …` | продюсеры и консьюмеры (имитация) | асинхронное событие ушло / пришло |

Ниже — фрагменты реальных логов (временные метки и PID Nest опущены).

**1. Покупатель кладёт товары в корзину** (2 чайника по 2500 ₽ + кофемолка за 4000 ₽ = 9000 ₽):

```bash
curl -X PUT localhost:3001/baskets/buyer-1/items -H 'Content-Type: application/json' -d '{"goodId":"good-1","quantity":2}'
curl -X PUT localhost:3001/baskets/buyer-1/items -H 'Content-Type: application/json' -d '{"goodId":"good-2","quantity":1}'
```

В логах basket — шаблон «восстановить → вызвать домен → сохранить» (на первом запросе корзины ещё нет, её создаёт use case):

```
[basket] [HTTP] → PUT /baskets/buyer-1/items body={"goodId":"good-2","quantity":1} → BasketController.changeItems
[basket] [InMemoryGoodRepository] [Memory] getById(good-2) → «Кофемолка», 4000 ₽, остаток: 5
[basket] [InMemoryBasketRepository] [Memory] getByBuyerId(buyer-1) → корзина d7f2552d (Created, позиций: 1, total: 5000 ₽, к оплате: 5000 ₽)
[basket] [InMemoryBasketRepository] [Memory] save → корзина d7f2552d (Created, позиций: 2, total: 9000 ₽, к оплате: 9000 ₽)
[basket] [HTTP] ← 200 PUT /baskets/buyer-1/items (0 мс)
```

**2. Попытка оформить корзину сразу.** Доменное правило не пускает, ответ 400:

```bash
curl -X POST localhost:3001/baskets/buyer-1/checkout
# {"error":"Нельзя оформить корзину без адреса доставки"}
```

Скидку use case успел запросить, но домен отказал в оформлении. Поэтому `save` нет, и в Kafka ничего не ушло:

```
[basket] [HTTP] → POST /baskets/buyer-1/checkout → BasketController.checkout
[basket] [InMemoryBasketRepository] [Memory] getByBuyerId(buyer-1) → корзина d7f2552d (Created, позиций: 2, total: 9000 ₽, к оплате: 9000 ₽)
[basket] [GrpcDiscountClient] [gRPC] → DiscountService.Calculate(total=9000) на http://localhost:3002
[basket] [GrpcDiscountClient] [gRPC] ← DiscountService.Calculate: discount=900 ₽
[basket] [HTTP] ← 400 POST /baskets/buyer-1/checkout: DomainError «Нельзя оформить корзину без адреса доставки»
```

**3. Адрес и период доставки:**

```bash
curl -X PUT localhost:3001/baskets/buyer-1/address -H 'Content-Type: application/json' -d '{"country":"Россия","city":"Москва","street":"Тверская","house":"1","apartment":"10"}'
curl -X PUT localhost:3001/baskets/buyer-1/time-slot -H 'Content-Type: application/json' -d '{"id":"slot-1","name":"Утро","start":"2026-11-01T09:00:00Z","end":"2026-11-01T12:00:00Z"}'
```

**4. Оформление.** Ответ: `"status":"CheckedOut"`, `"discount":900`, `"totalToPay":8100`.

```bash
curl -X POST localhost:3001/baskets/buyer-1/checkout
```

В логах видны все четыре шага use case: восстановить → вызвать домен (со скидкой из discount) → сохранить → опубликовать.

```
[basket]   [HTTP] → POST /baskets/buyer-1/checkout → BasketController.checkout
[basket]   [InMemoryBasketRepository] [Memory] getByBuyerId(buyer-1) → корзина d7f2552d (Created, позиций: 2, total: 9000 ₽, к оплате: 9000 ₽)
[basket]   [GrpcDiscountClient] [gRPC] → DiscountService.Calculate(total=9000) на http://localhost:3002
[discount] [DiscountController] [gRPC] → Calculate(basket=d7f2552d-…, total=9000)
[discount] [DiscountController] [gRPC] ← discount=900 ₽ (правило: 10% при сумме > 5000 ₽)
[basket]   [GrpcDiscountClient] [gRPC] ← DiscountService.Calculate: discount=900 ₽
[basket]   [InMemoryBasketRepository] [Memory] save → корзина d7f2552d (CheckedOut, позиций: 2, total: 9000 ₽, к оплате: 8100 ₽)
[basket]   [KafkaBusProducer] [Kafka] topic=basket.checked-out payload={"basketId":"d7f2552d-…","buyerId":"buyer-1",…,"total":8100,"name":"BasketCheckedOut",…}
[delivery] [BasketCheckedOutConsumer] [Kafka] получено topic=basket.checked-out payload=…
[delivery] [InMemoryCourierRepository] [Memory] getAll → курьеров: 3, свободны: Анна, Борис, Вера
[delivery] [InMemoryOrderRepository] [Memory] save → заказ 5f758396, корзина d7f2552d, точка (29, 23), курьер: courier-1
[delivery] [InMemoryCourierRepository] [Memory] save → курьер Анна (занят)
[delivery] [BasketCheckedOutConsumer] Доставка создана: заказ 5f758396-… (Москва, Тверская, 1, 10) → курьер Анна
[basket]   [KafkaBusProducer] [Kafka] basket.checked-out: потребитель обработал сообщение, ответ 200
[basket]   [HTTP] ← 200 POST /baskets/buyer-1/checkout (11 мс)
```

Курьера выбрал Domain Service `OrderDistributionService`. Сам он ничего не логирует, потому что это домен, а результат его работы виден в `save` заказа и курьера.

**5. Склад меняет остаток кофемолки** (Backoffice → warehouse):

```bash
curl -X PUT localhost:3003/stocks/good-2 -H 'Content-Type: application/json' -d '{"quantity":1}'
```

В логах тот же use case-шаблон, но в двух сервисах. Warehouse меняет остаток и публикует событие, а basket получает его через второй Primary Adapter (Kafka-консьюмер) и обновляет свой `Good`:

```
[warehouse] [HTTP] → PUT /stocks/good-2 body={"quantity":1} → StockController.change
[warehouse] [InMemoryStockRepository] [Memory] getByGoodId(good-2) → остаток: 5
[warehouse] [InMemoryStockRepository] [Memory] save → good-2, остаток: 1
[warehouse] [KafkaBusProducer] [Kafka] topic=warehouse.stock-changed payload={"goodId":"good-2","quantity":1,"name":"StockChanged",…}
[basket]    [StockChangedConsumer] [Kafka] получено topic=warehouse.stock-changed payload=…
[basket]    [InMemoryGoodRepository] [Memory] getById(good-2) → «Кофемолка», 4000 ₽, остаток: 5
[basket]    [InMemoryGoodRepository] [Memory] save → «Кофемолка», 4000 ₽, остаток: 1
[basket]    [StockChangedConsumer] Остаток товара good-2 обновлён: 1 шт.
[warehouse] [KafkaBusProducer] [Kafka] warehouse.stock-changed: потребитель обработал сообщение, ответ 200
[warehouse] [HTTP] ← 200 PUT /stocks/good-2 (19 мс)
```

**6. Остаток обновился в basket.** Другой покупатель не может взять 3 кофемолки:

```bash
curl -X PUT localhost:3001/baskets/buyer-2/items -H 'Content-Type: application/json' -d '{"goodId":"good-2","quantity":3}'
# {"error":"Нельзя положить 3 шт.: на складе осталось 1"}
```

```
[basket] [HTTP] → PUT /baskets/buyer-2/items body={"goodId":"good-2","quantity":3} → BasketController.changeItems
[basket] [InMemoryGoodRepository] [Memory] getById(good-2) → «Кофемолка», 4000 ₽, остаток: 1
[basket] [InMemoryBasketRepository] [Memory] getByBuyerId(buyer-2) → не найдена
[basket] [HTTP] ← 400 PUT /baskets/buyer-2/items: DomainError «Нельзя положить 3 шт.: на складе осталось 1»
```

Остаётся посмотреть корзину и проверить недоступность скидок. Остановите discount: корзина всё равно оформится, со скидкой 0 и предупреждением в логе basket.

```bash
curl localhost:3001/baskets/buyer-1
```

## 6. Что упрощено и почему

| Упрощение | Почему |
|---|---|
| PostgreSQL, Kafka, gRPC заменены in-memory хранилищами, логом и HTTP | Занятие про границы слоёв, а не про настройку инфраструктуры. Заглушки стоят ровно там, где в проде были бы настоящие адаптеры |
| Нет Transactional Outbox и транзакций | В use case помечено место, где они нужны: сохранение агрегата и публикация события должны быть атомарны |
| Нет авторизации | `buyerId` берётся из URL. В реальном приложении он пришёл бы из токена во входящем адаптере |
| Минимальная валидация входных данных | Важные правила проверяет домен, а входной DTO почти не валидируется |
| Сервис Geo опущен | Координаты адреса в delivery считает функция-заглушка `geocode` в `CreateDeliveryUseCase`. В реальном проекте там был бы исходящий порт `IGeoClient` |
| Контракты событий продублированы в сервисах | Это не упрощение, а решение: сервисы независимы, общий код создаёт связанность |

## 6а. Компромисс: NestJS в application-слое

Use cases помечены `@Injectable()`, а зависимости внедряются через `@Inject(TOKEN)`. Полный комментарий находится над [CheckoutBasketUseCase](services/basket/src/application/use-cases/checkout-basket.use-case.ts).

- **Что нарушается.** Формально это правило зависимостей (слайд 10): внутренний слой импортирует `@nestjs/common` из внешнего кольца Frameworks and Drivers.
- **Почему это ок.**
  - Декораторы — только метаданные для DI.
  - Use case по-прежнему создаётся через `new` с фейками, см. [тест](services/basket/test/checkout-basket.use-case.spec.ts).
  - Use case зависит от портов, а не от адаптеров.
  - Фреймворк меняют гораздо реже, чем БД или брокер.
- **Красная линия.** В application из Nest разрешены только `Injectable` и `Inject`. `Logger`, `HttpException` и т. п. уже размывают границу. В домене Nest нет совсем. Это проверяет `npm run lint` ([eslint.config.mjs](eslint.config.mjs)).

Для сравнения строгий вариант, которого в проекте **нет**:

```ts
// application/use-cases/checkout-basket.use-case.ts — ни одного импорта из Nest
export class CheckoutBasketUseCase implements ICheckoutBasket {
  constructor(
    private readonly basketRepository: IBasketRepository,
    private readonly discountClient: IDiscountClient,
    private readonly busProducer: IBusProducer,
  ) {}
  // ...
}

// basket.module.ts — каждый use case связывается вручную
{
  provide: CheckoutBasketUseCase,
  useFactory: (repo: IBasketRepository, discount: IDiscountClient, bus: IBusProducer) =>
    new CheckoutBasketUseCase(repo, discount, bus),
  inject: [BASKET_REPOSITORY, DISCOUNT_CLIENT, BUS_PRODUCER],
},
```

Он чище, но такой блок нужен на каждый use case. Добавили зависимость — правьте два места.

## 7. Упражнения

1. **Новое хранилище.** Реализуйте `RedisBasketRepository` (можно in-memory с логами `[Redis]`) и подключите его через `BASKET_STORAGE=redis`. Не меняйте ни строчки в `domain/` и `application/`.
2. **Новый Primary Adapter.** Добавьте CLI-команду или CRON-задачу (конспект §7.1), которая оформляет корзину покупателя через `ICheckoutBasket`. Убедитесь, что use case не изменился.
3. **Новое бизнес-правило.** Минимальная сумма заказа — 1000 ₽. Решите, в каком слое оно должно жить, реализуйте и покройте тестом в `test/basket.spec.ts`.
4. **Сломайте границу.** Добавьте в любой use case `import { Logger } from '@nestjs/common'` и запустите `npm run lint`. Объясните, почему линтер прав и как логировать, не нарушая границы (подсказка: исходящий порт `ILogger`).
