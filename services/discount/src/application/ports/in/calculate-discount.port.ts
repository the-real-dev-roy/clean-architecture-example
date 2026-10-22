// Application-слой, входящий порт: use case «Рассчитать скидку».
// Порт — контракт: Primary Adapter (DiscountServer) зависит от него, а не от реализации.
export interface ICalculateDiscount {
  execute(total: number): Promise<number>;
}
