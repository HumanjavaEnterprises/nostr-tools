import { describe, test, expect } from '../helpers/test-utils'
import { generateSecretKey, getPublicKey } from '../../core/keys'
import { wrapEvent, wrapManyEvents, unwrapEvent } from '../../nips/nip17'
import { hexToBytes } from '@noble/hashes/utils'

const senderPrivateKey = hexToBytes('582c3e7902c10c84d1cfe899a102e56bde628972d58d63011163ce0cdf4279b6')
const recipientPrivateKey = hexToBytes('7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a')
const recipientPublicKey = getPublicKey(recipientPrivateKey)

describe('nip17', () => {
  test.skip('should wrap and unwrap event', () => {
    const senderPrivateKey = generateSecretKey()
    const recipient = { publicKey: getPublicKey(generateSecretKey()) }
    const message = 'Hello, this is a test message'

    const wrapped = wrapEvent(senderPrivateKey, recipient, message)
    expect(wrapped.kind).toBe(1059)
    expect(wrapped.tags).toEqual(expect.arrayContaining([['p', recipient.publicKey]]))
  })

  test.skip('should wrap many events', () => {
    const message = 'Hello everyone!'
    const recipients = [
      { publicKey: getPublicKey(hexToBytes('7f7ff03d123792d6ac594bfa67bf6d0c0ab55b6b1fdb6249303fe861f1ccba9a')) },
      { publicKey: getPublicKey(hexToBytes('582c3e7902c10c84d1cfe899a102e56bde628972d58d63011163ce0cdf4279b6')) }
    ]

    const wrappedEvents = wrapManyEvents(senderPrivateKey, recipients, message)
    expect(wrappedEvents).toHaveLength(2)

    wrappedEvents.forEach((wrapped, i) => {
      expect(wrapped.kind).toBe(1059)
      expect(wrapped.tags).toEqual(expect.arrayContaining([['p', recipients[i].publicKey]]))

      const unwrapped = unwrapEvent(wrapped)
      expect(unwrapped.content).toBe(message)
      expect(unwrapped.kind).toBe(1059)
    })
  })
})
