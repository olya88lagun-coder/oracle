let consent = false;
let ready = false;
const listeners = new Set<(ready: boolean) => void>();

export const isAnalyticsReady = (): boolean => consent && ready;

function updateReady(next: boolean): void {
  if (ready === next) return;
  ready = next;
  for (const listener of [...listeners]) listener(isAnalyticsReady());
}

export function setAnalyticsConsent(allowed: boolean): void {
  consent = allowed;
  if (!allowed) updateReady(false);
}

// Called by the SDK, not by the presence of its temporary queue function.
export function markAnalyticsReady(): void {
  if (consent) updateReady(true);
}

export function onAnalyticsStateChange(listener: (ready: boolean) => void): () => void {
  listeners.add(listener);
  listener(isAnalyticsReady());
  return () => { listeners.delete(listener); };
}

// A view waits only while it is mounted. This does not replay pre-consent clicks.
export function whenAnalyticsReady(callback: () => void): () => void {
  if (isAnalyticsReady()) {
    callback();
    return () => {};
  }
  const listener = (available: boolean): void => {
    if (!available) return;
    listeners.delete(listener);
    callback();
  };
  return onAnalyticsStateChange(listener);
}
