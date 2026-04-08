// Mock for 'server-only' package — no-op in test environment
// The real package throws if imported on the client, but in tests we don't need that guard.
export {}
