type SessionInvalidatedHandler = () => void;

let sessionInvalidatedHandler: SessionInvalidatedHandler | null = null;

export function setSessionInvalidatedHandler(handler: SessionInvalidatedHandler | null): void {
  sessionInvalidatedHandler = handler;
}

export function notifySessionInvalidated(): void {
  sessionInvalidatedHandler?.();
}
