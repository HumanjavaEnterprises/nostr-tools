import { describe, test, expect, vi } from '../helpers/test-utils'
import { buildEvent } from '../helpers/test-helpers'
import { getExpiration, isEventExpired, waitForExpire, onExpire } from '../../nips/nip40'

describe('getExpiration', () => {
  it('returns the expiration as a Date object', () => {
    const event = buildEvent({ tags: [['expiration', '123']] })
    const result = getExpiration(event)
    expect(result).toEqual(new Date(123000))
  })
})

describe('isEventExpired', () => {
  it('returns true when the event has expired', () => {
    const event = buildEvent({ tags: [['expiration', '123']] })
    const result = isEventExpired(event)
    expect(result).toEqual(true)
  })

  it('returns false when the event has not expired', () => {
    const future = Math.floor(Date.now() / 1000) + 10
    const event = buildEvent({ tags: [['expiration', future.toString()]] })
    const result = isEventExpired(event)
    expect(result).toEqual(false)
  })
})

describe('waitForExpire', () => {
  it('returns a promise that resolves when the event expires', async () => {
    const event = buildEvent({ tags: [['expiration', '123']] })
    const result = await waitForExpire(event)
    expect(result).toEqual(event)
  })
})

describe('onExpire', () => {
  it('calls the callback when the event expires', async () => {
    const event = buildEvent({ tags: [['expiration', '123']] })
    const callback = vi.fn()
    onExpire(event, callback)
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(callback).toHaveBeenCalled()
  })
})
