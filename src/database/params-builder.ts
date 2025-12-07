export class ParamsBuilder {
  private params: unknown[] = [];

  constructor(initial: unknown[] = []) {
    this.params = [...initial];
  }

  getParams() {
    return [...this.params];
  }

  push(param: unknown) {
    this.params.push(param);
    return `$${this.params.length}`;
  }
}
