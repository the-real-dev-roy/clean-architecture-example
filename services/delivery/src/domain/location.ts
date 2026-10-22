// Domain-слой: Location — Value Object «точка на карте». Координаты — просто числа.
export class Location {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {
    Object.freeze(this);
  }

  distanceTo(other: Location): number {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
}
