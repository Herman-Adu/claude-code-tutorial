import { describe, it, expect } from 'vitest';

describe('Test Infrastructure', () => {
  it('should be properly configured', () => {
    expect(true).toBe(true);
  });

  it('should have access to vitest globals', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should have localStorage mocked', () => {
    expect(global.localStorage).toBeDefined();
    expect(global.localStorage.getItem).toBeDefined();
    expect(global.localStorage.setItem).toBeDefined();
  });
});
