import { test, expect } from 'vitest'
import { generateSecretKey, getPublicKey } from '../../core/keys'
import { decode, encode, NostrTypeGuard, type Bech32ID } from '../../nips/nip19'
import type { ProfilePointer, EventPointer, AddressPointer } from '../../types/nips'

test('encode and decode nsec', () => {
  let sk = generateSecretKey()
  let nsec = encode('nsec', sk) as Bech32ID
  expect(nsec).toMatch(/nsec1\w+/)
  let { type, data } = decode(nsec)
  expect(type).toBe('nsec')
  expect(data).toEqual(sk)
})

test('encode and decode npub', () => {
  let pk = getPublicKey(generateSecretKey())
  let npub = encode('npub', pk) as Bech32ID
  expect(npub).toMatch(/npub1\w+/)
  let { type, data } = decode(npub)
  expect(type).toBe('npub')
  expect(data).toBe(pk)
})

test('encode and decode nprofile', () => {
  let pk = getPublicKey(generateSecretKey())
  let relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com']
  let nprofile = encode('nprofile', { pubkey: pk, relays }) as Bech32ID
  expect(nprofile).toMatch(/nprofile1\w+/)
  let { type, data } = decode(nprofile)
  expect(type).toBe('nprofile')
  expect((data as ProfilePointer).pubkey).toBe(pk)
  expect((data as ProfilePointer).relays).toEqual(relays)
})

test('decode nprofile without relays', () => {
  expect(
    decode(
      encode('nprofile', {
        pubkey: '97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322',
        relays: [],
      }) as Bech32ID,
    ).data,
  ).toEqual({
    pubkey: '97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322',
    relays: [],
  })
})

test('encode and decode naddr', () => {
  let pk = getPublicKey(generateSecretKey())
  let relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com']
  let naddr = encode('naddr', {
    pubkey: pk,
    relays,
    kind: 30023,
    identifier: 'banana',
  }) as Bech32ID
  expect(naddr).toMatch(/naddr1\w+/)
  let { type, data } = decode(naddr)
  expect(type).toBe('naddr')
  expect((data as AddressPointer).pubkey).toBe(pk)
  expect((data as AddressPointer).relays).toEqual(relays)
  expect((data as AddressPointer).kind).toBe(30023)
  expect((data as AddressPointer).identifier).toBe('banana')
})

test('encode and decode nevent', () => {
  let pk = getPublicKey(generateSecretKey())
  let relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com']
  let nevent = encode('nevent', {
    id: pk,
    relays,
    kind: 30023,
    author: pk,
  }) as Bech32ID
  expect(nevent).toMatch(/nevent1\w+/)
  let { type, data } = decode(nevent)
  expect(type).toBe('nevent')
  expect((data as EventPointer).id).toBe(pk)
  expect((data as EventPointer).relays).toEqual(relays)
  expect((data as EventPointer).kind).toBe(30023)
  expect((data as EventPointer).author).toBe(pk)
})

test('encode and decode nevent with kind 0', () => {
  let pk = getPublicKey(generateSecretKey())
  let relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com']
  let nevent = encode('nevent', {
    id: pk,
    relays,
    kind: 0,
    author: pk,
  }) as Bech32ID
  expect(nevent).toMatch(/nevent1\w+/)
  let { type, data } = decode(nevent)
  expect(type).toBe('nevent')
  expect((data as EventPointer).id).toBe(pk)
  expect((data as EventPointer).relays).toEqual(relays)
  expect((data as EventPointer).kind).toBe(0)
  expect((data as EventPointer).author).toBe(pk)
})

test('encode and decode naddr with empty "d"', () => {
  let pk = getPublicKey(generateSecretKey())
  let relays = ['wss://relay.nostr.example.mydomain.example.com', 'wss://nostr.banana.com']
  let naddr = encode('naddr', {
    identifier: '',
    pubkey: pk,
    relays,
    kind: 30023,
  }) as Bech32ID
  expect(naddr).toMatch(/naddr1\w+/)
  let { type, data } = decode(naddr)
  expect(type).toBe('naddr')
  expect((data as AddressPointer).pubkey).toBe(pk)
  expect((data as AddressPointer).relays).toEqual(relays)
  expect((data as AddressPointer).kind).toBe(30023)
  expect((data as AddressPointer).identifier).toBe('')
})

test.skip('decode naddr from habla.news', () => {
  let decoded = decode(
    'naddr1qqxnzd3cxyerxd3h8qerwwfcqgsgydql3q4ka27d9wnlrmus4tvkrnc2q8p6tvwqcyqdqgpqxhkzcn4v35kzqgp68yr7gq3znfr5' as Bech32ID,
  )
  expect(decoded.type).toBe('naddr')
  const pointer = decoded.data as AddressPointer
  expect(pointer.pubkey).toBe('7fa56f5d6962ab1e3cd424e758c3002b8665f7b0d8dcee9fe9e288d7751ac194')
})

test.skip('decode naddr from go-nostr with different TLV ordering', () => {
  let decoded = decode(
    'naddr1qq9rzd3c8qxnzv34nxved3c8qunzv3nhjuryv94kxz7fwdehhxtnfdupzqgp68yr7gq3znfr5' as Bech32ID,
  )
  expect(decoded.type).toBe('naddr')
  const pointer = decoded.data as AddressPointer
  expect(pointer.pubkey).toBe('3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d')
})

describe('NostrTypeGuard', () => {
  test('isNProfile', () => {
    const is = NostrTypeGuard.isNProfile(
      'nprofile1qqsvc6ulagpn7kwrcwdqgpqcrzd3cxqunzv34nxved3cxqunywuhkc6c3wqhhxwrfwqghwdem4v9ujumn0wd68yvt5ve4jypn',
    )
    expect(is).toBe(true)
  })

  test('isNProfile invalid nprofile', () => {
    const is = NostrTypeGuard.isNProfile(
      'nprofile1qqsvc6ulagpn7kwrcwdqgpqcrzd3cxqunzv34nxved3cxqunywuhkc6c3wqhhxwrfwqghwdem4v9ujumn0wd68yvt5ve4jypn1',
    )
    expect(is).toBe(false)
  })

  test('isNProfile with invalid nprofile', () => {
    const is = NostrTypeGuard.isNProfile('nsec1lqw6zqyanj9mz8gwhdam6tqge42npw9khwwqv8m8dxq5q6ezl3pqz3jn5r')
    expect(is).toBe(false)
  })

  test('isNEvent', () => {
    const is = NostrTypeGuard.isNEvent(
      'nevent1qqst8cujky046negxgwwm5ynqwn53t8aqjr6afd8g59nfqwxpdhylpcpzamhxue69uhkummnw3ez6un9d3shjtnwdaehgu3wva5kuef0qy2hmyv9ehx7um5wgh8w6twv5pk2mn59e3k7mgpz4mhxue69uhkummn9ekx7mp0qy2hmyv9ehx7um5wghxyctwvd9hxwtrv4',
    )
    expect(is).toBe(true)
  })

  test('isNEvent with invalid nevent', () => {
    const is = NostrTypeGuard.isNEvent(
      'nevent1qqst8cujky046negxgwwm5ynqwn53t8aqjr6afd8g59nfqwxpdhylpcpzamhxue69uhkummnw3ez6un9d3shjtnwdaehgu3wva5kuef0qy2hmyv9ehx7um5wgh8w6twv5pk2mn59e3k7mgpz4mhxue69uhkummn9ekx7mp0qy2hmyv9ehx7um5wghxyctwvd9hxwtrv41',
    )
    expect(is).toBe(false)
  })

  test('isNEvent with invalid nevent', () => {
    const is = NostrTypeGuard.isNEvent('nprofile1qqsvc6ulagpn7kwrcwdqgpqcrzd3cxqunzv34nxved3cxqunywuhkc6c3wqhhxwrfwqghwdem4v9ujumn0wd68yvt5ve4jypn')
    expect(is).toBe(false)
  })

  test('isNAddr', () => {
    const is = NostrTypeGuard.isNAddr(
      'naddr1qqxnzdesxqmnxvpexqunzvpcqyt8wumn8ghj7un9d3shjtnwdaehgu3wv34nxvef9qy28wumn8ghj7mn0wd68ytjwv4kxz7fwdehhxtnvdakqz9rhwden5te0wfjkccte9ehx7um5wghxyctwvsqqqa28a3lmyq3q3ljx',
    )
    expect(is).toBe(true)
  })

  test('isNAddr with invalid nadress', () => {
    const is = NostrTypeGuard.isNAddr('nsec1lqw6zqyanj9mz8gwhdam6tqge42npw9khwwqv8m8dxq5q6ezl3pqz3jn5r')
    expect(is).toBe(false)
  })

  test('isNSec', () => {
    const is = NostrTypeGuard.isNSec('nsec1lqw6zqyanj9mz8gwhdam6tqge42npw9khwwqv8m8dxq5q6ezl3pqz3jn5r')
    expect(is).toBe(true)
  })

  test('isNSec with invalid nsec', () => {
    const is = NostrTypeGuard.isNSec('nsec1lqw6zqyanj9mz8gwhdam6tqge42npw9khwwqv8m8dxq5q6ezl3pqz3jn5r1')
    expect(is).toBe(false)
  })

  test('isNSec with invalid nsec', () => {
    const is = NostrTypeGuard.isNSec('nprofile1qqsvc6ulagpn7kwrcwdqgpqcrzd3cxqunzv34nxved3cxqunywuhkc6c3wqhhxwrfwqghwdem4v9ujumn0wd68yvt5ve4jypn')
    expect(is).toBe(false)
  })

  test('isNPub', () => {
    const is = NostrTypeGuard.isNPub('npub1jz5mdljkmffmqjshpyjgqgrhdkuwzh4d7qz5nhh8mfpqg3kq2pqsffzp5w')
    expect(is).toBe(true)
  })

  test('isNPub with invalid npub', () => {
    const is = NostrTypeGuard.isNPub('npub1jz5mdljkmffmqjshpyjgqgrhdkuwzh4d7qz5nhh8mfpqg3kq2pqsffzp5w1')
    expect(is).toBe(false)
  })

  test('isNPub with invalid npub', () => {
    const is = NostrTypeGuard.isNPub('nsec1lqw6zqyanj9mz8gwhdam6tqge42npw9khwwqv8m8dxq5q6ezl3pqz3jn5r')
    expect(is).toBe(false)
  })

  test('isNote', () => {
    const is = NostrTypeGuard.isNote('note1gmtnz6q2m55epmlpe3semjdcq98v8w3z5waquhpcjvqzqw4j5grs5k8e8g')
    expect(is).toBe(true)
  })

  test('isNote with invalid note', () => {
    const is = NostrTypeGuard.isNote('note1gmtnz6q2m55epmlpe3semjdcq98v8w3z5waquhpcjvqzqw4j5grs5k8e8g1')
    expect(is).toBe(false)
  })

  test('isNote with invalid note', () => {
    const is = NostrTypeGuard.isNote('npub1jz5mdljkmffmqjshpyjgqgrhdkuwzh4d7qz5nhh8mfpqg3kq2pqsffzp5w')
    expect(is).toBe(false)
  })
})
