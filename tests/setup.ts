import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5434/test_db';

// Mock localStorage
const localStorageMock = (() => {
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
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock server actions (will be overridden in specific tests)
vi.mock('@/app/actions/tasks', () => ({
  createTask: vi.fn(() => Promise.resolve({ success: true, data: { id: 'test-task-id' } })),
  updateTask: vi.fn(() => Promise.resolve({ success: true })),
  deleteTask: vi.fn(() => Promise.resolve({ success: true })),
  moveTask: vi.fn(() => Promise.resolve({ success: true })),
  getTasks: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getTasksByColumn: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getTasksByDateRange: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  // Search and filter actions
  searchTasks: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getSavedFilterPresets: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  saveFilterPreset: vi.fn(() => Promise.resolve({ success: true, data: { id: 'test-preset-id' } })),
  deleteFilterPreset: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock label server actions
vi.mock('@/app/actions/labels', () => ({
  createLabel: vi.fn(() => Promise.resolve({ success: true, data: { id: 'test-label-id', name: 'Test Label', color: '#3B82F6' } })),
  updateLabel: vi.fn(() => Promise.resolve({ success: true })),
  deleteLabel: vi.fn(() => Promise.resolve({ success: true })),
  getLabels: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getLabelById: vi.fn(() => Promise.resolve({ success: true, data: null })),
  addLabelToTask: vi.fn(() => Promise.resolve({ success: true })),
  removeLabelFromTask: vi.fn(() => Promise.resolve({ success: true })),
  getLabelsForTask: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  setLabelsForTask: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock notification server actions
vi.mock('@/app/actions/notifications', () => ({
  getNotifications: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getUnreadNotificationCount: vi.fn(() => Promise.resolve({ success: true, data: 0 })),
  markNotificationAsRead: vi.fn(() => Promise.resolve({ success: true })),
  markAllNotificationsAsRead: vi.fn(() => Promise.resolve({ success: true })),
  deleteNotification: vi.fn(() => Promise.resolve({ success: true })),
  createNotification: vi.fn(() => Promise.resolve({ success: true, data: { id: 'test-notification-id' } })),
}));

// Mock comment server actions (Phase 2C)
vi.mock('@/app/actions/comments', () => ({
  createComment: vi.fn(() => Promise.resolve({ success: true, data: { id: 'test-comment-id', content: 'Test comment' } })),
  updateComment: vi.fn(() => Promise.resolve({ success: true })),
  deleteComment: vi.fn(() => Promise.resolve({ success: true })),
  getCommentsByTask: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getComment: vi.fn(() => Promise.resolve({ success: true, data: null })),
}));

// Mock activity server actions (Phase 2C)
vi.mock('@/app/actions/activity', () => ({
  getTaskActivity: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  getUserActivity: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  logTaskActivity: vi.fn(() => Promise.resolve({ success: true, data: { id: 'test-activity-id' } })),
  getTaskActivityCounts: vi.fn(() => Promise.resolve({ success: true, data: { total: 0 } })),
}));

// Mock rate limiting - always allow in tests
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => Promise.resolve({ success: true, remaining: 10, reset: Date.now() + 60000 })),
  getRateLimitErrorMessage: vi.fn((type: string) => `Rate limit exceeded for ${type}`),
  RATE_LIMITS: {
    labels: { max: 10, window: '1h', prefix: 'ratelimit:labels' },
    comments: { max: 50, window: '1h', prefix: 'ratelimit:comments' },
    search: { max: 20, window: '1m', prefix: 'ratelimit:search' },
    changePassword: { max: 3, window: '15m', prefix: 'ratelimit:changePassword' },
    updateProfile: { max: 10, window: '1h', prefix: 'ratelimit:updateProfile' },
    deleteAccount: { max: 5, window: '1h', prefix: 'ratelimit:deleteAccount' },
  },
  cleanupInMemoryStore: vi.fn(),
  resetRateLimiters: vi.fn(),
}));
