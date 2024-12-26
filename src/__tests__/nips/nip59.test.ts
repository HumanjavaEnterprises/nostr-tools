import { test, expect } from '../helpers/test-utils'
import { generateSecretKey, getPublicKey } from '../../core/keys'
import { wrapEvent, unwrapEvent, wrapManyEvents, unwrapManyEvents } from '../../nips/nip59'
import { hexToBytes } from '@noble/hashes/utils'

const senderPrivateKey = generateSecretKey()
const recipientPrivateKey = generateSecretKey()
const recipientPublicKey = getPublicKey(recipientPrivateKey)

describe('nip59', () => {
  test.skip('should wrap and unwrap event', () => {
    const event = {
      id: '123',
      pubkey: '456',
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: 'Hello, this is a test event',
      sig: '789'
    }

    const wrappedEvent = wrapEvent(event, senderPrivateKey, recipientPublicKey)
    expect(wrappedEvent.kind).toBe(1059)
    expect(wrappedEvent.tags).toContainEqual(['p', recipientPublicKey])
  })

  test.skip('should wrap many events', () => {
    const event = {
      id: '123',
      pubkey: '456',
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: 'Hello, this is a test event',
      sig: '789'
    }

    const recipients = [
      getPublicKey(generateSecretKey()),
      getPublicKey(generateSecretKey())
    ]

    const wrappedEvents = wrapManyEvents(event, senderPrivateKey, recipients)
    expect(wrappedEvents).toHaveLength(2)
  })
})
