import { vi } from 'vitest';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  debug: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Mock URL and URLSearchParams
global.URL = URL;
global.URLSearchParams = URLSearchParams;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/project-detail.html?id=diyapp',
    search: '?id=diyapp',
    pathname: '/project-detail.html',
    origin: 'http://localhost:3000'
  },
  writable: true
});

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn()
  },
  writable: true
});

// Mock document.createElement for notifications
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
  const element = originalCreateElement.call(document, tagName);
  if (tagName === 'div' && element.className?.includes('notification')) {
    // Mock notification element behavior
    element.remove = vi.fn();
    element.parentNode = { removeChild: vi.fn() };
  }
  return element;
};

// Helper function to create minimal DOM structure for project detail page
export function createProjectDetailDOM() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="main-wrapper">
      <div class="project-detail-grid">
        <div id="project-title">Loading Project...</div>
        <div id="project-subtitle">Loading...</div>
        <div id="project-description">Loading project description...</div>
        <div id="project-status">Loading...</div>
        <div id="project-phase">Loading...</div>
        <div id="last-updated">Loading...</div>
        <div id="project-progress">
          <div class="progress-fill" style="width: 0%"></div>
          <span class="progress-text">0% Complete</span>
        </div>
        <ul id="completed-tasks"></ul>
        <ul id="in-progress-tasks"></ul>
        <ul id="pending-tasks"></ul>
        <ul id="project-files"></ul>
        <div id="project-timeline"></div>
        <div id="activity-log"></div>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  return container;
}

// Helper function to clear DOM
export function clearDOM() {
  document.body.innerHTML = '';
}

// Helper function to set URL parameters
export function setURLParams(params) {
  const search = new URLSearchParams(params).toString();
  window.location.search = search ? `?${search}` : '';
}

// Helper function to mock fetch response
export function mockFetchResponse(data, status = 200) {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    json: () => Promise.resolve(data)
  });
}

// Helper function to mock sessionStorage data
export function mockSessionStorage(data) {
  sessionStorageMock.getItem.mockReturnValue(JSON.stringify(data));
}
