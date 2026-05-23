type ErrorNotifier = (message: string) => void;

let notifier: ErrorNotifier | null = null;

/** Called from inside AntdApp (e.g. ApolloGlobalErrorNotifier). Returns unregister. */
export function registerGraphqlErrorNotifier(fn: ErrorNotifier): () => void {
  notifier = fn;
  return () => {
    notifier = null;
  };
}

export function notifyGraphqlErrorUserMessage(message: string): void {
  notifier?.(message);
}
