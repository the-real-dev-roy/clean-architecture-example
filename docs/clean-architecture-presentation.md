# Архитектура приложения: Layered · Onion · Clean · Hexagonal

> Конспект презентации по архитектуре backend-приложений.
> Цель занятия: рассмотреть Layered, Onion, Clean и Hexagonal Architecture и понять разницу между ними.
> Сквозной пример: сервис **Basket** (корзина) в микросервисном маркетплейсе.

---

## 1. Layered Architecture (слоистая архитектура)

Зависимости направлены в одну сторону, сверху вниз:

```
UI (View / API / Consumers)
        ↓
Business Logic
        ↓
Infrastructure (PostgreSQL, Kafka, внешние gRPC/HTTP API)
```

- Входящие взаимодействия: HTTP API (Web/Mobile App), gRPC API (External System), Kafka.
- Исходящие взаимодействия: PostgreSQL, Kafka, gRPC API (External System).

### Проблема 1 — зависимость бизнес-логики от БД

```
UI → Business Logic (Service, Entity) → Infrastructure (Repository)
```

- Бизнес-логика зависит от инфраструктуры, а значит — от базы данных.
- Смена БД или схемы данных затрагивает бизнес-логику.

### Проблема 2 — «толстые» сервисы

```
HTTP Handler ─┐
HTTP Handler ─┴→ Service → Entity, Entity → Repository, Repository
```

- Вся бизнес-логика собирается в одном Service.
- Service разрастается и становится «толстым».

---

## 2. Dependency Inversion Principle (DIP)

> «Высокоуровневые модули, реализующие бизнес-логику, не должны зависеть от низкоуровневых модулей.»

```
UI → Business Logic ← Infrastructure
```

- Зависимость от инфраструктуры инвертируется: Infrastructure зависит от Business Logic (реализует её интерфейсы), а не наоборот.
- **Это решает Проблему 1.**

---

## 3. Hexagonal Architecture (Ports & Adapters)

- Ядро (Application) общается с внешним миром **только через Port**.
- Технологии вынесены в **Adapter** — их замена не затрагивает ядро.

```
[HTTP API / gRPC API / Kafka]                         [PostgreSQL / Kafka / gRPC API]
            ↓                                                       ↑
   Primary Adapters (входящие)                         Secondary Adapters (исходящие)
            ↓                                                       ↑
          Port  ───────────────→  Application  ──────────────→  Port
```

- Primary Adapters — входящие (вызывают приложение).
- Secondary Adapters — исходящие (вызываются приложением).
- Каждый адаптер подключён к ядру через свой порт.

---

## 4. Onion Architecture (луковая архитектура)

Концентрические слои, от внешнего к внутреннему:

1. **User Interface** / **Infrastructure** (внешнее кольцо)
2. **Application Services**
3. **Domain Services**
4. **Domain Model** (центр)

- Domain Model + Domain Services + Application Services = **Application Core**.
- Зависимости направлены **внутрь, к ядру**.
- Внешние системы (HTTP API, gRPC API, Kafka, PostgreSQL) находятся на внешнем кольце.

---

## 5. Clean Architecture (чистая архитектура)

Концентрические слои, от внешнего к внутреннему:

| Слой | Содержимое (примеры из презентации) |
|---|---|
| **Frameworks and Drivers** | DB Driver, External Interfaces; технологии: HTTP API, gRPC API, Kafka, PostgreSQL |
| **Interface Adapters** | Handler, Consumer, Repositories, Gateways |
| **Use Cases** | Сценарии приложения |
| **Entities** | Бизнес-сущности |

- **Правило зависимостей (Dependency Rule):** зависимости идут только снаружи внутрь.
- **Entities ничего не знают о внешнем мире.**

---

## 6. Layered vs Hexagonal / Onion / Clean

| | Layered | Hexagonal / Onion / Clean |
|---|---|---|
| Направление зависимостей | UI → Business Logic → Infrastructure | UI → Business Logic ← Infrastructure |
| Бизнес-логика зависит от инфраструктуры | Да | Нет (зависимость инвертирована) |

**Вывод:** все три подхода (Hexagonal, Onion, Clean) объединяет **инверсия зависимости от инфраструктуры**. Различаются они структурой и терминологией.

---

## 7. Adapters (адаптеры)

Внешние системы подключаются к Application Core **только через адаптеры**.

- **Primary (driving) Adapters** — управляют приложением.
- **Secondary (driven) Adapters** — управляются приложением.

```
[HTTP API]  [gRPC API]  [Kafka]                [gRPC API] [Kafka] [Redis] [PostgreSQL]
     ↓           ↓          ↓                        ↑        ↑       ↑         ↑
 HTTP Handler  gRPC Handler  Kafka Consumer     gRPC Client  Kafka   Redis   PostgreSQL
   (Primary / driving adapters)                            Producer  Repo    Repository
     ↓                                                (Secondary / driven adapters)
                    ──────→   Application Core   ──────→
```

### 7.1 Primary (input) Adapters

Принимают входящие запросы и события и вызывают Application Core. Это **точки входа**:

1. HTTP Handlers
2. gRPC Handlers
3. Kafka Consumers
4. RabbitMQ Consumers
5. Console Commands
6. CRON Jobs

### 7.2 Secondary (output) Adapters

Вызываются из Application Core и обращаются к внешним системам. Это **точки выхода**:

1. Repository (PostgreSQL Repository, Redis Repository)
2. Kafka Producers
3. RabbitMQ Producers
4. gRPC Client
5. HTTP Client

---

## 8. Ports (порты)

- **Порт задаёт контракт**, адаптер его **реализует или использует**.
- Ядро зависит **только от собственных интерфейсов** (DIP).
- **Один порт — несколько реализаций.**

Порты внутри Application Core:

| Тип порта | Примеры | Кто с ним работает |
|---|---|---|
| Входящие | **Use Cases** | Используются Primary-адаптерами (HTTP Handler, gRPC Handler, Kafka Consumer) |
| Исходящие | `IClient`, `IBus`, `IRepository` | Реализуются Secondary-адаптерами: `IClient` → gRPC Client, `IBus` → Kafka Producer, `IRepository` → PostgreSQL Repository / Redis Repository |

---

## 9. Система: маркетплейс

Каждый сервис — отдельное приложение со своими адаптерами и хранилищем.
**Kafka — асинхронное взаимодействие, gRPC — синхронное.**

### Состав системы

| Компонент | Назначение |
|---|---|
| Shop | front-end магазина |
| Backoffice | front-end бэк-офиса |
| **Basket** | корзина |
| Delivery | доставка |
| Warehouse | склад |
| Discount | скидки |
| Geo | геопозиции |
| Notification | нотификации |

### Связи и адаптеры (по диаграмме)

- Shop → Basket по **HTTP** (в Basket: HTTP [Adapter]).
- Backoffice → Warehouse по **HTTP** (HTTP [Adapter]).
- Basket хранит данные в **PostgreSQL** через `BasketRepository [Adapter]`.
- Basket → Discount по **gRPC**: в Basket `DiscountClient [Adapter]`, в Discount `DiscountServer [Adapter]`.
- Delivery → Geo по **gRPC**: в Delivery `GeoServiceClient [Adapter]`, в Geo `GeoServer [Adapter]`.
- Delivery хранит данные в **PostgreSQL** через `DeliveryRepository [Adapter]`.
- Сервисы обмениваются событиями через **Kafka** (Kafka [Adapter] у Basket, Delivery, Warehouse, Notification и др.).

### Сервис Basket в коде

```
Adapters (реализации — технологии)
├── Входящие
│   ├── HTTP
│   └── Kafka
└── Исходящие
    ├── Postgres
    ├── gRPC
    └── Kafka

Ports (интерфейсы ядра)
├── Входящие
│   └── Use Cases
└── Исходящие
    ├── IBasketRepository
    ├── IGoodRepository
    ├── IDiscountClient
    └── IBusProducer
```

### Use Cases корзины

Актор **Покупатель**:
- Изменить состав корзины
- Получить состав корзины
- Оформить корзину
- Добавить адрес доставки
- Добавить период доставки

Актор **Склад**:
- Актуализировать остатки товара

---

## 10. Application Core (смысловое ядро приложения)

- **Самое главное, о чём нужно думать:** этот слой содержит основную суть приложения.
- Технологии и адаптеры вокруг ядра **вторичны и заменяемы**.
- Внутри ядра: Use Cases (входящие порты) и интерфейсы `IClient`, `IBus`, `IRepository` (исходящие порты).

### 10.1 Domain Logic vs Application Logic

| | Domain Logic | Application Logic |
|---|---|---|
| Отвечает на вопрос | **ЧТО** должно выполнять приложение | **КАК** приложение должно это делать |
| Пример | «Если положить товар в корзину, то стоимость корзины увеличится на стоимость товара с учётом его количества» | «Восстановить объект корзины из БД по ID, вызвать метод изменения состава, сохранить корзину в БД» |

### 10.2 Domain Layer и Application Layer

```
Application Layer (Use Cases, IClient, IBus, IRepository)
        ↓ зависит от
Domain Layer
```

- **Application Layer зависит от Domain Layer, а не наоборот.**
- **Domain Layer** — доменная логика (ЧТО делает приложение).
- **Application Layer** — прикладная логика (КАК); общается с внешним миром через порты.

### 10.3 Application Layer состоит из Use Cases

- **Use Case (вариант использования)** — сценарий, описывающий взаимоотношения участников внутри системы для достижения конкретной цели.
- **Use Cases по сути — входящие Ports.**
- Пример для Basket (актор — Покупатель): изменить состав корзины, добавить период доставки, добавить адрес доставки, оформить корзину, получить состав корзины.

### 10.4 Domain Layer: поток выполнения

```
Use Case
  → вызывает Method агрегата
    → Domain Object [Aggregate] (содержит Entity, Value Object)
      → меняет состояние по бизнес-правилам
      → порождает Domain Event
        → Domain Event уходит наружу через IBus
          → IBus реализован Kafka Producer (Secondary Adapter)
```

- **Домен ничего не знает о технологиях.**

### 10.5 Domain Model сервиса Basket

**Domain Model** — объектная модель предметной области, включающая поведение и данные: бизнес-правила и отношения **инкапсулированы в модели**.

Два агрегата: **Basket Aggregate** и **Good Aggregate**.

#### Basket Aggregate

**`Basket` [Aggregate root]**
- Поля: `Id`, `BuyerId`, `Address`, `TimeSlot`, `Items`, `Status`
- Методы:
  - `Create(buyerId)`
  - `Change(good, quantity)`
  - `AddAddress(address)`
  - `AddTimeSlot(timeSlot)`
  - `Checkout()`

**`Address` [Value Object]**
- Поля: Страна, Город, Улица, Дом, Квартира

**`Status` [Entity]**
- Поля: `Id`, `Name`

**`Item` [Entity]**
- Поля: `Id`, `Title`, `Description`, `Price`, `Quantity`
- Методы:
  - `Create(good, quantity)`
  - `SetQuantity(quantity)`

**`TimeSlot` [Entity]**
- Поля: `Id`, `Name`, `Start`, `End`

#### Good Aggregate

**`Good` [Aggregate root]**
- Поля: `Id`, `Title`, `Description`, `Price`

### 10.6 Domain Service

- **Domain Service** (служба предметной области) инкапсулирует логику предметной области или процессы, которые **не относятся ни к одному доменному объекту**.
- Если правило затрагивает несколько доменных объектов и не принадлежит ни одному из них, его выносят в Domain Service.
- Пример: **«Алгоритм распределения заказов» [Domain Service]** работает с доменными объектами **Заказы** и **Курьеры**.

---

## 11. Итоги

1. Рассмотрели Layered Architecture и её проблемы (зависимость от БД, «толстые» сервисы).
2. Узнали Dependency Inversion Principle.
3. Рассмотрели Onion / Clean / Hexagonal Architecture — их объединяет инверсия зависимости от инфраструктуры.
4. Поняли, какой слой за что отвечает:
   - **Primary Adapters** — точки входа, вызывают Use Cases.
   - **Use Cases (Application Layer)** — КАК: оркестрация, работа через порты.
   - **Domain Layer (Aggregates, Entities, Value Objects, Domain Services, Domain Events)** — ЧТО: бизнес-правила, без знания о технологиях.
   - **Ports** — интерфейсы ядра (входящие = Use Cases; исходящие = `IRepository`, `IClient`, `IBus`).
   - **Secondary Adapters** — реализации исходящих портов (PostgreSQL/Redis Repository, Kafka Producer, gRPC/HTTP Client).
