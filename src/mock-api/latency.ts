const MIN_MS = 300;
const MAX_MS = 800;

export function simulateLatency(): Promise<void> {
  const ms = MIN_MS + Math.random() * (MAX_MS - MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
