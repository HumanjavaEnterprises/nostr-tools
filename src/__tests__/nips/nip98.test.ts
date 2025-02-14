import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { describe, expect, test } from '../helpers/test-utils'

import { HTTPAuth } from '../../types/kinds'
import {
  getToken,
  hashPayload,
  unpackEventFromToken,
  validateEvent,
  validateEventKind,
  validateEventMethodTag,
  validateEventPayloadTag,
  validateEventTimestamp,
  validateEventUrlTag,
  validateToken,
} from '../../nips/nip98'
import { Event, finalizeEvent, generateSecretKey, getPublicKey } from '../../core/pure'
import { utf8Encoder } from '../../utils'

describe('getToken', () => {
  it('returns without authorization scheme for GET', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk))
    const unpackedEvent: Event = await unpackEventFromToken(token)

    expect(unpackedEvent.created_at).toBeGreaterThan(0)
    expect(unpackedEvent.content).toBe('')
    expect(unpackedEvent.kind).toBe(HTTPAuth)
    expect(unpackedEvent.pubkey).toBe(getPublicKey(sk))
    expect(unpackedEvent.tags).toStrictEqual([
      ['u', 'http://test.com'],
      ['method', 'get'],
    ])
  })

  it('returns token without authorization scheme for POST', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'post', e => finalizeEvent(e, sk))
    const unpackedEvent: Event = await unpackEventFromToken(token)

    expect(unpackedEvent.created_at).toBeGreaterThan(0)
    expect(unpackedEvent.content).toBe('')
    expect(unpackedEvent.kind).toBe(HTTPAuth)
    expect(unpackedEvent.pubkey).toBe(getPublicKey(sk))
    expect(unpackedEvent.tags).toStrictEqual([
      ['u', 'http://test.com'],
      ['method', 'post'],
    ])
  })

  it('returns token WITH authorization scheme for POST', async () => {
    const authorizationScheme = 'Nostr '
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'post', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)

    expect(token.startsWith(authorizationScheme)).toBe(true)
    expect(unpackedEvent.created_at).toBeGreaterThan(0)
    expect(unpackedEvent.content).toBe('')
    expect(unpackedEvent.kind).toBe(HTTPAuth)
    expect(unpackedEvent.pubkey).toBe(getPublicKey(sk))
    expect(unpackedEvent.tags).toStrictEqual([
      ['u', 'http://test.com'],
      ['method', 'post'],
    ])
  })

  it('returns token with a valid payload tag when payload is present', async () => {
    const sk = generateSecretKey()
    const payload = { test: 'payload' }
    const payloadHash = hashPayload(payload)
    const token = await getToken('http://test.com', 'post', e => finalizeEvent(e, sk), true, payload)
    const unpackedEvent: Event = await unpackEventFromToken(token)

    expect(unpackedEvent.created_at).toBeGreaterThan(0)
    expect(unpackedEvent.content).toBe('')
    expect(unpackedEvent.kind).toBe(HTTPAuth)
    expect(unpackedEvent.pubkey).toBe(getPublicKey(sk))
    expect(unpackedEvent.tags).toStrictEqual([
      ['u', 'http://test.com'],
      ['method', 'post'],
      ['payload', payloadHash],
    ])
  })
})

describe('validateToken', () => {
  it('returns true for valid token without authorization scheme', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk))

    const isTokenValid = await validateToken(token, 'http://test.com', 'get')
    expect(isTokenValid).toBe(true)
  })

  it('returns true for valid token with authorization scheme', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const isTokenValid = await validateToken(token, 'http://test.com', 'get')

    expect(isTokenValid).toBe(true)
  })

  it('throws an error for invalid token', async () => {
    const isTokenValid = validateToken('fake', 'http://test.com', 'get')

    expect(isTokenValid).rejects.toThrow(Error)
  })

  it('throws an error for missing token', async () => {
    const isTokenValid = validateToken('', 'http://test.com', 'get')

    expect(isTokenValid).rejects.toThrow(Error)
  })

  it('throws an error for invalid event kind', async () => {
    const sk = generateSecretKey()
    const invalidToken = await getToken('http://test.com', 'get', e => {
      e.kind = 0
      return finalizeEvent(e, sk)
    })
    const isTokenValid = validateToken(invalidToken, 'http://test.com', 'get')

    expect(isTokenValid).rejects.toThrow(Error)
  })

  it('throws an error for invalid event timestamp', async () => {
    const sk = generateSecretKey()
    const invalidToken = await getToken('http://test.com', 'get', e => {
      e.created_at = 0
      return finalizeEvent(e, sk)
    })
    const isTokenValid = validateToken(invalidToken, 'http://test.com', 'get')

    expect(isTokenValid).rejects.toThrow(Error)
  })

  it('throws an error for invalid url', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk))
    const isTokenValid = validateToken(token, 'http://wrong-test.com', 'get')

    expect(isTokenValid).rejects.toThrow(Error)
  })

  it('throws an error for invalid method', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk))
    const isTokenValid = validateToken(token, 'http://test.com', 'post')

    expect(isTokenValid).rejects.toThrow(Error)
  })
})

describe('validateEvent', () => {
  it('returns true for valid decoded token with authorization scheme', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventValid = await validateEvent(unpackedEvent, 'http://test.com', 'get')

    expect(isEventValid).toBe(true)
  })

  it('throws an error for invalid event kind', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    unpackedEvent.kind = 0
    const isEventValid = validateEvent(unpackedEvent, 'http://test.com', 'get')

    expect(isEventValid).rejects.toThrow(Error)
  })

  it('throws an error for invalid event timestamp', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    unpackedEvent.created_at = 0
    const isEventValid = validateEvent(unpackedEvent, 'http://test.com', 'get')

    expect(isEventValid).rejects.toThrow(Error)
  })

  it('throws an error for invalid url tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventValid = validateEvent(unpackedEvent, 'http://wrong-test.com', 'get')

    expect(isEventValid).rejects.toThrow(Error)
  })

  it('throws an error for invalid method tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventValid = validateEvent(unpackedEvent, 'http://test.com', 'post')

    expect(isEventValid).rejects.toThrow(Error)
  })

  it('returns true for valid payload tag hash', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'post', e => finalizeEvent(e, sk), true, { test: 'payload' })
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventValid = await validateEvent(unpackedEvent, 'http://test.com', 'post', { test: 'payload' })

    expect(isEventValid).toBe(true)
  })

  it('returns false for invalid payload tag hash', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'post', e => finalizeEvent(e, sk), true, { test: 'a-payload' })
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventValid = validateEvent(unpackedEvent, 'http://test.com', 'post', { test: 'a-different-payload' })

    expect(isEventValid).rejects.toThrow(Error)
  })
})

describe('validateEventTimestamp', () => {
  it('returns true for valid timestamp', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventTimestampValid = validateEventTimestamp(unpackedEvent)

    expect(isEventTimestampValid).toBe(true)
  })

  it('returns false for invalid timestamp', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    unpackedEvent.created_at = 0
    const isEventTimestampValid = validateEventTimestamp(unpackedEvent)

    expect(isEventTimestampValid).toBe(false)
  })
})

describe('validateEventKind', () => {
  it('returns true for valid kind', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventKindValid = validateEventKind(unpackedEvent)

    expect(isEventKindValid).toBe(true)
  })

  it('returns false for invalid kind', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    unpackedEvent.kind = 0
    const isEventKindValid = validateEventKind(unpackedEvent)

    expect(isEventKindValid).toBe(false)
  })
})

describe('validateEventUrlTag', () => {
  it('returns true for valid url tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventUrlTagValid = validateEventUrlTag(unpackedEvent, 'http://test.com')

    expect(isEventUrlTagValid).toBe(true)
  })

  it('returns false for invalid url tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventUrlTagValid = validateEventUrlTag(unpackedEvent, 'http://wrong-test.com')

    expect(isEventUrlTagValid).toBe(false)
  })
})

describe('validateEventMethodTag', () => {
  it('returns true for valid method tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventMethodTagValid = validateEventMethodTag(unpackedEvent, 'get')

    expect(isEventMethodTagValid).toBe(true)
  })

  it('returns false for invalid method tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'get', e => finalizeEvent(e, sk), true)
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventMethodTagValid = validateEventMethodTag(unpackedEvent, 'post')

    expect(isEventMethodTagValid).toBe(false)
  })
})

describe('validateEventPayloadTag', () => {
  it('returns true for valid payload tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'post', e => finalizeEvent(e, sk), true, { test: 'payload' })
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventPayloadTagValid = validateEventPayloadTag(unpackedEvent, { test: 'payload' })

    expect(isEventPayloadTagValid).toBe(true)
  })

  it('returns false for invalid payload tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'post', e => finalizeEvent(e, sk), true, { test: 'a-payload' })
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventPayloadTagValid = validateEventPayloadTag(unpackedEvent, { test: 'a-different-payload' })

    expect(isEventPayloadTagValid).toBe(false)
  })

  it('returns false for missing payload tag', async () => {
    const sk = generateSecretKey()
    const token = await getToken('http://test.com', 'post', e => finalizeEvent(e, sk), true, { test: 'payload' })
    const unpackedEvent: Event = await unpackEventFromToken(token)
    const isEventPayloadTagValid = validateEventPayloadTag(unpackedEvent, {})

    expect(isEventPayloadTagValid).toBe(false)
  })
})

describe('hashPayload', () => {
  it('returns hash for valid payload', async () => {
    const payload = { test: 'payload' }
    const computedPayloadHash = hashPayload(payload)
    const expectedPayloadHash = bytesToHex(sha256(utf8Encoder.encode(JSON.stringify(payload))))

    expect(computedPayloadHash).toBe(expectedPayloadHash)
  })

  it('returns hash for empty payload', async () => {
    const payload = {}
    const computedPayloadHash = hashPayload(payload)
    const expectedPayloadHash = bytesToHex(sha256(utf8Encoder.encode(JSON.stringify(payload))))

    expect(computedPayloadHash).toBe(expectedPayloadHash)
  })
})
