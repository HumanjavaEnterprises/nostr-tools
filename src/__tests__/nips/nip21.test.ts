import { test, expect } from '../helpers/test-utils'
import { parse } from '../../nips/nip21'

const testRegex = (str: string) => {
  try {
    return parse(str) !== null
  } catch {
    return false
  }
}

test.skip('it()', () => {
  expect(testRegex('nostr:npub108pv4cg5ag52nq082kd5leu9ffrn2gdg6g4xdwatn73y36uzpl')).toBe(true)
  expect(testRegex('nostr:note1gmtnz6q2m55epmlpe3semjdcq987av3jvx4emmjsa8g3s9x7tg')).toBe(true)
  expect(testRegex(' nostr:npub108pv4cg5ag52nq082kd5leu9ffrn2gdg6g4xdwatn73y36uzp')).toBe(true)
  expect(testRegex('nostr:')).toBe(false)
})

it('parse', () => {
  const result = parse('nostr:note1gmtnz6q2m55epmlpe3semjdcq987av3jvx4emmjsa8g3s9x7tg4sclreky')

  expect(result).toEqual({
    uri: 'nostr:note1gmtnz6q2m55epmlpe3semjdcq987av3jvx4emmjsa8g3s9x7tg4sclreky',
    value: 'note1gmtnz6q2m55epmlpe3semjdcq987av3jvx4emmjsa8g3s9x7tg4sclreky',
    decoded: {
      type: 'note',
      data: '46d731680add2990efe1cc619dc9b8014feeb23261ab9dee50e9d11814de5a2b',
    },
  })
})
