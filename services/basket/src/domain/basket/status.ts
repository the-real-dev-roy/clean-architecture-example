// Domain-слой: Status — Entity с полями Id и Name, как в презентации (слайд 29, конспект §10.5).
// Набор статусов закрыт, поэтому они заданы статическими экземплярами.
// На практике статус чаще делают обычным enum — здесь оставлено как на слайде.
export class Status {
  static readonly Created = new Status(1, 'Created');
  static readonly CheckedOut = new Status(2, 'CheckedOut');

  private constructor(
    readonly id: number,
    readonly name: string,
  ) {}

  equals(other: Status): boolean {
    return this.id === other.id;
  }
}
