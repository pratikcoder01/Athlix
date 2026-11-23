// Same-origin hints clear stale tab state; the server remains the authority.
// No credentials, account identifiers, or profile information cross this channel.
const channelName = 'athlix-session-events';
const storageKey = 'athlix-session-event';
type SignOutEvent = { type: 'signed-out'; startedAt: number };
const isSignOut = (value: unknown): value is SignOutEvent => typeof value === 'object' && value !== null &&
  'type' in value && value.type === 'signed-out' && 'startedAt' in value &&
  typeof value.startedAt === 'number' && Number.isFinite(value.startedAt) && value.startedAt > 0;

export const publishSessionSignOut = (startedAt: number) => {
  const event: SignOutEvent = { type: 'signed-out', startedAt };
  try {
    const channel = new BroadcastChannel(channelName);
    channel.postMessage(event); channel.close();
    return;
  } catch { /* Storage events support browsers without BroadcastChannel. */ }
  try {
    localStorage.setItem(storageKey, JSON.stringify(event));
    localStorage.removeItem(storageKey);
  } catch { /* Restricted browser storage must not prevent confirmed sign-out. */ }
};

export const subscribeSessionSignOut = (onSignOut: (startedAt: number) => void) => {
  const receive = (value: unknown) => { if (isSignOut(value)) onSignOut(value.startedAt); };
  let channel: BroadcastChannel | undefined;
  try {
    channel = new BroadcastChannel(channelName);
    channel.onmessage = event => receive(event.data);
  } catch { /* Listen for the storage fallback below. */ }
  const storage = (event: StorageEvent) => {
    if (event.key !== storageKey || !event.newValue || event.newValue.length > 256) return;
    try { receive(JSON.parse(event.newValue)); } catch { /* Ignore unrelated/malformed hints. */ }
  };
  window.addEventListener('storage', storage);
  return () => { channel?.close(); window.removeEventListener('storage', storage); };
};
