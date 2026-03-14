export function getCorrelationId(): string { return Math.random().toString(36).slice(2); }
export function setCorrelationId(_id: string): void {}
export function withCorrelation<T>(fn: () => T): T { return fn(); }
