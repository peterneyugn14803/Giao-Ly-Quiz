class SafeStorage {
  private cache: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Could not read key "${key}" from localStorage:`, e);
    }
    return this.cache[key] !== undefined ? this.cache[key] : null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Could not write key "${key}" to localStorage:`, e);
    }
    this.cache[key] = value;
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Could not remove key "${key}" from localStorage:`, e);
    }
    delete this.cache[key];
  }
}

export const safeStorage = new SafeStorage();
