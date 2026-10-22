// Domain-слой сервиса discount: правило скидки — ЧТО (слайд 25, конспект §10.1).
// Чистая функция без зависимостей: правило легко прочитать и протестировать.
export const DISCOUNT_THRESHOLD = 5000; // ₽
export const DISCOUNT_PERCENT = 10;

/** Скидка 10% при сумме корзины выше 5000 ₽. Возвращает сумму скидки в рублях. */
export function calculateDiscount(total: number): number {
  if (total <= DISCOUNT_THRESHOLD) {
    return 0;
  }
  return Math.round((total * DISCOUNT_PERCENT) / 100);
}
