import { vi } from 'vitest';

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  // Add storage object to simulate actual localStorage
  _storage: {} as Record<string, string>,
};

// Implement actual localStorage behavior
localStorageMock.getItem = vi.fn((key: string) => {
  return localStorageMock._storage[key] || null;
});

localStorageMock.setItem = vi.fn((key: string, value: string) => {
  localStorageMock._storage[key] = value;
});

localStorageMock.removeItem = vi.fn((key: string) => {
  delete localStorageMock._storage[key];
});

localStorageMock.clear = vi.fn(() => {
  localStorageMock._storage = {};
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock Web Workers
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null,
  onerror: null,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Math.random for consistent test results
Math.random = vi.fn(() => 0.5);

// Mock Date.now for consistent timestamps
Date.now = vi.fn(() => 1640995200000); // 2022-01-01 00:00:00 UTC
 