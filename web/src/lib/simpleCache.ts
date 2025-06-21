type CacheEntry<T> = {
  data: T;
  expires: number;
};

export class SimpleCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  constructor(private ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T) {
    this.store.set(key, { data, expires: Date.now() + this.ttlMs });
  }
}
