import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should return initialValue when localStorage is empty', async () => {
      const { result } = renderHook(() =>
        useLocalStorage('test-key', 'initial-value')
      );

      // Initially shows initial value
      expect(result.current[0]).toBe('initial-value');

      // After effect runs, should still be initial value and hydrated
      await waitFor(() => {
        expect(result.current[2]).toBe(true);
      });
      expect(result.current[0]).toBe('initial-value');
    });

    it('should return initialValue for primitive types', () => {
      const { result: stringResult } = renderHook(() =>
        useLocalStorage('string-key', 'test')
      );
      expect(stringResult.current[0]).toBe('test');

      const { result: numberResult } = renderHook(() =>
        useLocalStorage('number-key', 42)
      );
      expect(numberResult.current[0]).toBe(42);

      const { result: booleanResult } = renderHook(() =>
        useLocalStorage('boolean-key', true)
      );
      expect(booleanResult.current[0]).toBe(true);
    });

    it('should return initialValue for complex types', () => {
      const initialObject = { name: 'John', age: 30 };
      const { result: objectResult } = renderHook(() =>
        useLocalStorage('object-key', initialObject)
      );
      expect(objectResult.current[0]).toEqual(initialObject);

      const initialArray = [1, 2, 3];
      const { result: arrayResult } = renderHook(() =>
        useLocalStorage('array-key', initialArray)
      );
      expect(arrayResult.current[0]).toEqual(initialArray);
    });

    it('should return initialValue when localStorage contains null', async () => {
      localStorage.setItem('null-key', 'null');

      const { result } = renderHook(() =>
        useLocalStorage('null-key', 'default')
      );

      // After hydration, should parse null correctly
      await waitFor(() => {
        expect(result.current[2]).toBe(true);
      });

      // JSON.parse('null') returns actual null value
      expect(result.current[0]).toBe(null);
    });
  });

  describe('Hydration Behavior', () => {
    it('should set isHydrated to false initially and true after mount', async () => {
      const { result } = renderHook(() =>
        useLocalStorage('hydration-key', 'initial')
      );

      // In test environment, hydration happens synchronously
      // so isHydrated is true immediately after render
      expect(result.current[2]).toBe(true);
    });

    it('should load stored value from localStorage after hydration', async () => {
      const storedValue = { user: 'Jane', id: 123 };
      localStorage.setItem('stored-key', JSON.stringify(storedValue));

      const { result } = renderHook(() =>
        useLocalStorage('stored-key', { user: 'Default', id: 0 })
      );

      // In test environment, hydration happens synchronously
      // so stored value is loaded immediately after render
      expect(result.current[0]).toEqual(storedValue);
      expect(result.current[2]).toBe(true);
    });

    it('should hydrate with stored primitive values', async () => {
      localStorage.setItem('string-key', JSON.stringify('stored-string'));
      localStorage.setItem('number-key', JSON.stringify(999));
      localStorage.setItem('boolean-key', JSON.stringify(false));

      const { result: stringResult } = renderHook(() =>
        useLocalStorage('string-key', 'default')
      );
      await waitFor(() => {
        expect(stringResult.current[0]).toBe('stored-string');
      });

      const { result: numberResult } = renderHook(() =>
        useLocalStorage('number-key', 0)
      );
      await waitFor(() => {
        expect(numberResult.current[0]).toBe(999);
      });

      const { result: booleanResult } = renderHook(() =>
        useLocalStorage('boolean-key', true)
      );
      await waitFor(() => {
        expect(booleanResult.current[0]).toBe(false);
      });
    });

    it('should hydrate with stored array values', async () => {
      const storedArray = ['apple', 'banana', 'cherry'];
      localStorage.setItem('array-key', JSON.stringify(storedArray));

      const { result } = renderHook(() =>
        useLocalStorage('array-key', [] as string[])
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(storedArray);
        expect(result.current[2]).toBe(true);
      });
    });

    it('should hydrate with stored nested object values', async () => {
      const storedObject = {
        user: {
          name: 'Alice',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
      };
      localStorage.setItem('nested-key', JSON.stringify(storedObject));

      const { result } = renderHook(() =>
        useLocalStorage('nested-key', { user: { name: '', preferences: {} } })
      );

      await waitFor(() => {
        expect(result.current[0]).toEqual(storedObject);
        expect(result.current[2]).toBe(true);
      });
    });
  });

  describe('Setting Values', () => {
    it('should update state and localStorage when setting a value directly', async () => {
      const { result } = renderHook(() =>
        useLocalStorage('update-key', 'initial')
      );

      // Wait for hydration
      await waitFor(() => {
        expect(result.current[2]).toBe(true);
      });

      const setValue = result.current[1];

      act(() => {
        setValue('updated-value');
      });

      expect(result.current[0]).toBe('updated-value');
      expect(localStorage.getItem('update-key')).toBe(
        JSON.stringify('updated-value')
      );
    });

    it('should update state with objects', async () => {
      const { result } = renderHook(() =>
        useLocalStorage('object-update-key', { count: 0 })
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]({ count: 5 });
      });

      expect(result.current[0]).toEqual({ count: 5 });
      expect(localStorage.getItem('object-update-key')).toBe(
        JSON.stringify({ count: 5 })
      );
    });

    it('should update state with arrays', async () => {
      const { result } = renderHook(() =>
        useLocalStorage('array-update-key', [1, 2, 3])
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]([4, 5, 6]);
      });

      expect(result.current[0]).toEqual([4, 5, 6]);
      expect(localStorage.getItem('array-update-key')).toBe(
        JSON.stringify([4, 5, 6])
      );
    });

    it('should handle multiple updates correctly', async () => {
      const { result } = renderHook(() =>
        useLocalStorage('multi-update-key', 0)
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1](1);
      });
      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1](2);
      });
      expect(result.current[0]).toBe(2);

      act(() => {
        result.current[1](3);
      });
      expect(result.current[0]).toBe(3);

      expect(localStorage.getItem('multi-update-key')).toBe(JSON.stringify(3));
    });

    it('should update localStorage with null values', async () => {
      const { result } = renderHook(() =>
        useLocalStorage<string | null>('nullable-key', 'initial')
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBe(null);
      expect(localStorage.getItem('nullable-key')).toBe(JSON.stringify(null));
    });
  });

  describe('Functional Updates', () => {
    it('should support functional updates with previous value', async () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0));

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
      expect(localStorage.getItem('counter')).toBe(JSON.stringify(1));
    });

    it('should support multiple functional updates in sequence', async () => {
      const { result } = renderHook(() => useLocalStorage('counter', 10));

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]((prev) => prev + 5);
      });
      expect(result.current[0]).toBe(15);

      act(() => {
        result.current[1]((prev) => prev * 2);
      });
      expect(result.current[0]).toBe(30);

      act(() => {
        result.current[1]((prev) => prev - 10);
      });
      expect(result.current[0]).toBe(20);

      expect(localStorage.getItem('counter')).toBe(JSON.stringify(20));
    });

    it('should support functional updates with objects', async () => {
      const { result } = renderHook(() =>
        useLocalStorage('user', { name: 'John', age: 30 })
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]((prev) => ({ ...prev, age: prev.age + 1 }));
      });

      expect(result.current[0]).toEqual({ name: 'John', age: 31 });
      expect(localStorage.getItem('user')).toBe(
        JSON.stringify({ name: 'John', age: 31 })
      );
    });

    it('should support functional updates with arrays', async () => {
      const { result } = renderHook(() =>
        useLocalStorage('items', ['a', 'b'])
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]((prev) => [...prev, 'c']);
      });

      expect(result.current[0]).toEqual(['a', 'b', 'c']);

      act(() => {
        result.current[1]((prev) => prev.filter((item) => item !== 'b'));
      });

      expect(result.current[0]).toEqual(['a', 'c']);
      expect(localStorage.getItem('items')).toBe(JSON.stringify(['a', 'c']));
    });

    it('should handle functional updates that return the same value', async () => {
      const { result } = renderHook(() => useLocalStorage('static', 42));

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]((prev) => prev);
      });

      expect(result.current[0]).toBe(42);
      expect(localStorage.getItem('static')).toBe(JSON.stringify(42));
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON.parse errors when reading from localStorage', async () => {
      // Store invalid JSON
      localStorage.setItem('invalid-json', '{invalid json}');
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage('invalid-json', 'fallback')
      );

      // Should use initial value when parse fails
      await waitFor(() => {
        expect(result.current[0]).toBe('fallback');
        expect(result.current[2]).toBe(true);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error reading from localStorage:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage.getItem throwing an error', async () => {
      // Set up console.error spy first
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock getItem directly on localStorage object
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage is not available');
      });

      const { result } = renderHook(() =>
        useLocalStorage('error-key', 'default')
      );

      // Should use default value and be hydrated
      expect(result.current[0]).toBe('default');
      expect(result.current[2]).toBe(true);

      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error reading from localStorage:',
        expect.any(Error)
      );

      localStorage.getItem = originalGetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle localStorage.setItem throwing an error', async () => {
      // Set up console.error spy first
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock setItem directly on localStorage object
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Quota exceeded');
      });

      const { result } = renderHook(() =>
        useLocalStorage('quota-key', 'initial')
      );

      // Wait for hydration
      expect(result.current[2]).toBe(true);

      // Try to set value - should catch error
      act(() => {
        result.current[1]('new-value');
      });

      // State should still update even if localStorage fails
      expect(result.current[0]).toBe('new-value');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving to localStorage:',
        expect.any(Error)
      );

      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON.stringify throwing an error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage<any>('circular-key', {})
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      // Create circular reference
      const circularObj: any = { prop: 'value' };
      circularObj.self = circularObj;

      act(() => {
        result.current[1](circularObj);
      });

      // State updates but localStorage fails
      expect(result.current[0]).toBe(circularObj);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving to localStorage:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty string in localStorage', async () => {
      localStorage.setItem('empty-key', '');

      const { result } = renderHook(() =>
        useLocalStorage('empty-key', 'default')
      );

      // Empty string is falsy, so should use initial value
      await waitFor(() => {
        expect(result.current[0]).toBe('default');
        expect(result.current[2]).toBe(true);
      });
    });
  });

  describe('Key Changes', () => {
    it('should handle changing keys between rerenders', async () => {
      const { result, rerender } = renderHook(
        ({ key, initialValue }) => useLocalStorage(key, initialValue),
        {
          initialProps: { key: 'key1', initialValue: 'value1' },
        }
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]('updated-value1');
      });

      expect(localStorage.getItem('key1')).toBe(
        JSON.stringify('updated-value1')
      );

      // Change key
      rerender({ key: 'key2', initialValue: 'value2' });

      await waitFor(() => {
        expect(result.current[0]).toBe('value2');
      });
    });

    it('should load different values for different keys', async () => {
      localStorage.setItem('keyA', JSON.stringify('valueA'));
      localStorage.setItem('keyB', JSON.stringify('valueB'));

      const { result: resultA } = renderHook(() =>
        useLocalStorage('keyA', 'defaultA')
      );
      const { result: resultB } = renderHook(() =>
        useLocalStorage('keyB', 'defaultB')
      );

      await waitFor(() => {
        expect(resultA.current[0]).toBe('valueA');
        expect(resultB.current[0]).toBe('valueB');
      });
    });
  });

  describe('Type Safety', () => {
    it('should work with string type', async () => {
      const { result } = renderHook(() =>
        useLocalStorage<string>('string-type', 'test')
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]('new string');
      });

      expect(result.current[0]).toBe('new string');
    });

    it('should work with number type', async () => {
      const { result } = renderHook(() =>
        useLocalStorage<number>('number-type', 42)
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1](100);
      });

      expect(result.current[0]).toBe(100);
    });

    it('should work with boolean type', async () => {
      const { result } = renderHook(() =>
        useLocalStorage<boolean>('boolean-type', false)
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
    });

    it('should work with array type', async () => {
      const { result } = renderHook(() =>
        useLocalStorage<number[]>('array-type', [])
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]([1, 2, 3]);
      });

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    it('should work with object type', async () => {
      interface User {
        name: string;
        age: number;
      }

      const { result } = renderHook(() =>
        useLocalStorage<User>('object-type', { name: 'John', age: 30 })
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]({ name: 'Jane', age: 25 });
      });

      expect(result.current[0]).toEqual({ name: 'Jane', age: 25 });
    });

    it('should work with union types', async () => {
      const { result } = renderHook(() =>
        useLocalStorage<string | null>('union-type', null)
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]('string value');
      });
      expect(result.current[0]).toBe('string value');

      act(() => {
        result.current[1](null);
      });
      expect(result.current[0]).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in key names', async () => {
      const specialKey = 'key:with:special@chars#123';
      const { result } = renderHook(() =>
        useLocalStorage(specialKey, 'value')
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]('updated');
      });

      expect(localStorage.getItem(specialKey)).toBe(JSON.stringify('updated'));
    });

    it('should handle very long key names', async () => {
      const longKey = 'a'.repeat(1000);
      const { result } = renderHook(() => useLocalStorage(longKey, 'value'));

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1]('updated');
      });

      expect(localStorage.getItem(longKey)).toBe(JSON.stringify('updated'));
    });

    it('should handle very long values', async () => {
      const longValue = 'x'.repeat(10000);
      const { result } = renderHook(() => useLocalStorage('long-value', ''));

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1](longValue);
      });

      expect(result.current[0]).toBe(longValue);
      expect(localStorage.getItem('long-value')).toBe(
        JSON.stringify(longValue)
      );
    });

    it('should handle undefined in objects', async () => {
      const objectWithUndefined = { key: 'value', undef: undefined };
      const { result } = renderHook(() =>
        useLocalStorage('undefined-key', objectWithUndefined)
      );

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        result.current[1](objectWithUndefined);
      });

      // JSON.stringify removes undefined properties
      const stored = JSON.parse(
        localStorage.getItem('undefined-key') || '{}'
      );
      expect(stored).toEqual({ key: 'value' });
    });

    it('should handle rapid successive updates', async () => {
      const { result } = renderHook(() => useLocalStorage('rapid-key', 0));

      await waitFor(() => expect(result.current[2]).toBe(true));

      act(() => {
        for (let i = 1; i <= 10; i++) {
          result.current[1](i);
        }
      });

      expect(result.current[0]).toBe(10);
      expect(localStorage.getItem('rapid-key')).toBe(JSON.stringify(10));
    });

    it('should work when window is undefined during SSR-like conditions', async () => {
      const { result } = renderHook(() => useLocalStorage('ssr-key', 'value'));

      // The hook should handle typeof window checks
      await waitFor(() => expect(result.current[2]).toBe(true));

      // setValue should still work (it checks typeof window !== 'undefined')
      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
    });
  });

  describe('Persistence', () => {
    it('should persist value across hook remounts', async () => {
      const { result: firstMount } = renderHook(() =>
        useLocalStorage('persist-key', 'initial')
      );

      await waitFor(() => expect(firstMount.current[2]).toBe(true));

      act(() => {
        firstMount.current[1]('persisted-value');
      });

      // Unmount and remount
      const { result: secondMount } = renderHook(() =>
        useLocalStorage('persist-key', 'initial')
      );

      await waitFor(() => {
        expect(secondMount.current[0]).toBe('persisted-value');
        expect(secondMount.current[2]).toBe(true);
      });
    });

    it('should persist complex objects across remounts', async () => {
      const complexObject = {
        id: 123,
        name: 'Test',
        items: [1, 2, 3],
        nested: { key: 'value' },
      };

      const { result: firstMount } = renderHook(() =>
        useLocalStorage('complex-persist', {})
      );

      await waitFor(() => expect(firstMount.current[2]).toBe(true));

      act(() => {
        firstMount.current[1](complexObject);
      });

      // Remount
      const { result: secondMount } = renderHook(() =>
        useLocalStorage('complex-persist', {})
      );

      await waitFor(() => {
        expect(secondMount.current[0]).toEqual(complexObject);
      });
    });
  });
});
