/**
 * LocalStorage Mock Utilities
 *
 * Provides a mock localStorage implementation for testing.
 */

// ============================================================================
// Types
// ============================================================================

export interface MockLocalStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  readonly length: number;
  key: (index: number) => string | null;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a mock localStorage instance.
 * Each call returns a fresh, isolated store.
 */
export function createMockLocalStorage(): MockLocalStorage {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
}

/**
 * Creates a mock localStorage with pre-populated data.
 */
export function createMockLocalStorageWithData(data: Record<string, string>): MockLocalStorage {
  const storage = createMockLocalStorage();
  Object.entries(data).forEach(([key, value]) => {
    storage.setItem(key, value);
  });
  return storage;
}

// ============================================================================
// Global Setup Helpers
// ============================================================================

/**
 * Installs the mock localStorage on the global object.
 * Returns a cleanup function to restore the original.
 */
export function installMockLocalStorage(storage?: MockLocalStorage): () => void {
  const mockStorage = storage ?? createMockLocalStorage();
  const originalLocalStorage = global.localStorage;

  Object.defineProperty(global, 'localStorage', {
    value: mockStorage,
    configurable: true,
    writable: true,
  });

  return () => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
      writable: true,
    });
  };
}

/**
 * Clears the current global localStorage mock.
 * Safe to call even if localStorage is not mocked.
 */
export function clearMockLocalStorage(): void {
  if (typeof global.localStorage?.clear === 'function') {
    global.localStorage.clear();
  }
}
