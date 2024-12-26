import { test, expect } from '../helpers/test-utils'
import { matchAll, replaceAll } from '../../nips/nip27'

test('matchAll', () => {
  const text = 'hello nostr:npub108pv4cg5ag52nq082kd5leu9ffrn2gdg6g4xdwatn73y36uzplmq9uyev6 nostr:note1gmtnz6q2m55epmlpe3semjdcq987av3jvx4emmjsa8g3s9x7tg4sclreky'
  const matches = [...matchAll(text)]
  expect(matches).toHaveLength(2)
  expect(matches[0].uri).toBe('nostr:npub108pv4cg5ag52nq082kd5leu9ffrn2gdg6g4xdwatn73y36uzplmq9uyev6')
  expect(matches[1].uri).toBe('nostr:note1gmtnz6q2m55epmlpe3semjdcq987av3jvx4emmjsa8g3s9x7tg4sclreky')
})

test.skip('matchAll with an invalid nip19', () => {
  const text = 'hello nostr:npub129tvj896hqqkljerxkccpj9flshwnw999v9uwn9lfmwlj8vnzwgq9y5llnpub1rujdpkd8mwezrvpqd2rx2zphfaztqrtsfg6w3vdnlj'
  const matches = [...matchAll(text)]
  expect(matches).toHaveLength(0)
})

test('replaceAll', () => {
  const text = 'hello nostr:npub108pv4cg5ag52nq082kd5leu9ffrn2gdg6g4xdwatn73y36uzplmq9uyev6 nostr:note1gmtnz6q2m55epmlpe3semjdcq987av3jvx4emmjsa8g3s9x7tg4sclreky'
  const replaced = replaceAll(text, (match) => `[${match.uri}]`)
  expect(replaced).toBe('hello [nostr:npub108pv4cg5ag52nq082kd5leu9ffrn2gdg6g4xdwatn73y36uzplmq9uyev6] [nostr:note1gmtnz6q2m55epmlpe3semjdcq987av3jvx4emmjsa8g3s9x7tg4sclreky]')
})
