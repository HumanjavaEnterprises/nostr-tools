import { expect, vi } from 'vitest'

export function mockEvent(overrides: Record<string, any> = {}) {
  return {
    id: 'test-id',
    pubkey: 'test-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: 'test content',
    sig: 'test-sig',
    ...overrides
  }
}

export function expectType<T>(value: T) {
  return value
}

export * from 'vitest'
