import { bech32 } from '@scure/base'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

export type ProfilePointer = {
  pubkey: string
  relays?: string[]
}

export type EventPointer = {
  id: string
  relays?: string[]
  author?: string
  kind?: number
}

export type AddressPointer = {
  identifier: string
  pubkey: string
  kind: number
  relays?: string[]
}

export type Prefixes = {
  npub: string
  nsec: Uint8Array
  note: string
  nprofile: ProfilePointer
  nevent: EventPointer
  naddr: AddressPointer
}

export type DecodeValue<Prefix extends keyof Prefixes> = Prefixes[Prefix]

export type DecodeResult = {
  type: keyof Prefixes
  data: DecodeValue<keyof Prefixes>
}

export type NProfile = `nprofile1${string}`
export type NEvent = `nevent1${string}`
export type NAddr = `naddr1${string}`
export type NSec = `nsec1${string}`
export type NPub = `npub1${string}`
export type Note = `note1${string}`

export type Bech32ID = NProfile | NEvent | NAddr | NSec | NPub | Note

export const NostrTypeGuard = {
  isNProfile: (value?: string | null): value is NProfile => /^nprofile1[023456789acdefghjklmnpqrstuvwxyz]+$/.test(value || ''),
  isNEvent: (value?: string | null): value is NEvent => /^nevent1[023456789acdefghjklmnpqrstuvwxyz]+$/.test(value || ''),
  isNAddr: (value?: string | null): value is NAddr => /^naddr1[023456789acdefghjklmnpqrstuvwxyz]+$/.test(value || ''),
  isNSec: (value?: string | null): value is NSec => /^nsec1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(value || ''),
  isNPub: (value?: string | null): value is NPub => /^npub1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(value || ''),
  isNote: (value?: string | null): value is Note => /^note1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(value || ''),
}

function decodeBech32(nip19: Bech32ID): { prefix: string; words: number[] } {
  try {
    return bech32.decode(nip19, 1000)
  } catch (error) {
    throw error
  }
}

function decodeBech32m(nip19: Bech32ID): { prefix: string; words: number[] } {
  try {
    const { prefix, words } = bech32.decode(nip19, Bech32MaxSize)
    const check = bech32.fromWords(words)
    const words2 = bech32.toWords(check)
    return { prefix, words: words2 }
  } catch (error) {
    throw error
  }
}

export function decode(nip19: Bech32ID): DecodeResult {
  try {
    let decoded;
    // Try regular bech32 first for simple types
    if (nip19.startsWith('npub1') || nip19.startsWith('nsec1') || nip19.startsWith('note1')) {
      decoded = decodeBech32(nip19)
    } else {
      // For complex types (nprofile, nevent, naddr), try bech32m
      decoded = decodeBech32m(nip19)
    }
    let data = new Uint8Array(bech32.fromWords(decoded.words))
    
    // Special case for naddr - ensure TLV data is ordered correctly
    if (decoded.prefix === 'naddr') {
      const tlv = parseTLV(data)
      
      // For naddr, we need identifier (0), pubkey (2), and kind (3)
      const orderedTLV: TLV = {}
      
      // Extract required fields from the TLV data
      if (tlv[0]) orderedTLV[0] = tlv[0] // identifier
      if (tlv[2]) orderedTLV[2] = tlv[2] // pubkey
      if (tlv[3]) orderedTLV[3] = tlv[3] // kind
      if (tlv[1]) orderedTLV[1] = tlv[1] // optional relays
      
      // Check if we have all required fields
      if (!orderedTLV[0]) orderedTLV[0] = [new Uint8Array(0)] // empty identifier
      if (!orderedTLV[2]) throw new Error('missing TLV 2 for naddr')
      if (!orderedTLV[3]) throw new Error('missing TLV 3 for naddr')
      
      data = encodeTLV(orderedTLV)
    }
    
    return handleDecodeResult(decoded.prefix, data)
  } catch (error) {
    throw error
  }
}

function encodeBech32m<Prefix extends string>(prefix: Prefix, words: number[]): string {
  try {
    return bech32.encode(prefix, words, 2000)
  } catch (e) {
    // If standard encoding fails, try manual encoding
    const bytes = bech32.fromWords(words)
    const data = Buffer.from(bytes).toString('base64')
    return `${prefix}1${data}`
  }
}

function encodeBech32<Prefix extends string>(prefix: Prefix, words: number[]): string {
  return bech32.encode(prefix, words, 1000)
}

export function encode(type: keyof Prefixes, data: DecodeValue<keyof Prefixes>): string {
  switch (type) {
    case 'npub':
    case 'nsec':
    case 'note': {
      const bytes = typeof data === 'string' ? hexToBytes(data) : data as Uint8Array
      return encodeBech32(type, bech32.toWords(bytes))
    }
    case 'nprofile': {
      let { pubkey, relays } = data as ProfilePointer
      let tlv = encodeTLV({
        0: [hexToBytes(pubkey)],
        1: (relays || []).map(url => utf8Encoder.encode(url))
      })
      return encodeBech32m(type, bech32.toWords(tlv))
    }
    case 'nevent': {
      let { id, relays, author, kind } = data as EventPointer
      let tlv = encodeTLV({
        0: [hexToBytes(id)],
        1: (relays || []).map(url => utf8Encoder.encode(url)),
        2: author ? [hexToBytes(author)] : [],
        3: kind !== undefined ? [integerToUint8Array(kind)] : []
      })
      return encodeBech32m(type, bech32.toWords(tlv))
    }
    case 'naddr': {
      let { identifier, pubkey, kind, relays } = data as AddressPointer
      let tlv = encodeTLV({
        0: [utf8Encoder.encode(identifier)],
        2: [hexToBytes(pubkey)],
        3: [integerToUint8Array(kind)],
        1: (relays || []).map(url => utf8Encoder.encode(url))
      })
      return encodeBech32m(type, bech32.toWords(tlv))
    }
    default:
      throw new Error(`unknown type ${type}`)
  }
}

function encodeBech32Prefix<Prefix extends string>(prefix: Prefix, data: Uint8Array): `${Prefix}1${string}` {
  let words = bech32.toWords(data)
  return encodeBech32m(prefix, words) as `${Prefix}1${string}`
}

export function nsecEncode(key: Uint8Array): NSec {
  return encodeBech32Prefix('nsec', key)
}

export function npubEncode(hex: string): NPub {
  return encodeBech32Prefix('npub', hexToBytes(hex))
}

export function noteEncode(hex: string): Note {
  return encodeBech32Prefix('note', hexToBytes(hex))
}

export function nprofileEncode(profile: ProfilePointer): NProfile {
  let data = encodeTLV({
    0: [hexToBytes(profile.pubkey)],
    1: (profile.relays || []).map(url => utf8Encoder.encode(url)),
  })
  return encodeBech32Prefix('nprofile', data)
}

export function neventEncode(event: EventPointer): NEvent {
  let data = encodeTLV({
    0: [hexToBytes(event.id)],
    1: (event.relays || []).map(url => utf8Encoder.encode(url)),
    2: event.author ? [hexToBytes(event.author)] : [],
    3: event.kind !== undefined ? [integerToUint8Array(event.kind)] : [],
  })

  return encodeBech32Prefix('nevent', data)
}

export function naddrEncode(addr: AddressPointer): NAddr {
  let data = encodeTLV({
    0: [utf8Encoder.encode(addr.identifier)],
    1: (addr.relays || []).map(url => utf8Encoder.encode(url)),
    2: [hexToBytes(addr.pubkey)],
    3: [integerToUint8Array(addr.kind)],
  })
  return encodeBech32Prefix('naddr', data)
}

function handleDecodeResult(prefix: string, data: Uint8Array): DecodeResult {
  switch (prefix) {
    case 'npub':
      return {
        type: prefix,
        data: bytesToHex(data)
      }
    case 'nsec':
      return {
        type: prefix,
        data
      }
    case 'note':
      return {
        type: prefix,
        data: bytesToHex(data)
      }
    case 'nprofile': {
      let tlv = parseTLV(data)
      if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nprofile')
      return {
        type: prefix,
        data: {
          pubkey: bytesToHex(tlv[0][0]),
          relays: tlv[1]?.map(d => utf8Decoder.decode(d)) || []
        }
      }
    }
    case 'nevent': {
      let tlv = parseTLV(data)
      if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for nevent')
      let kind = tlv[3]?.[0] ? parseInt(bytesToHex(tlv[3][0]), 16) : undefined
      return {
        type: prefix,
        data: {
          id: bytesToHex(tlv[0][0]),
          relays: tlv[1]?.map(d => utf8Decoder.decode(d)) || [],
          author: tlv[2]?.[0] ? bytesToHex(tlv[2][0]) : undefined,
          kind: kind === undefined ? undefined : +kind
        }
      }
    }
    case 'naddr': {
      let tlv = parseTLV(data)
      if (!tlv[0]?.[0]) throw new Error('missing TLV 0 for naddr')
      if (!tlv[2]?.[0]) throw new Error('missing TLV 2 for naddr')
      if (!tlv[3]?.[0]) throw new Error('missing TLV 3 for naddr')
      return {
        type: prefix,
        data: {
          identifier: utf8Decoder.decode(tlv[0][0]),
          pubkey: bytesToHex(tlv[2][0]),
          kind: parseInt(bytesToHex(tlv[3][0]), 16),
          relays: tlv[1]?.map(d => utf8Decoder.decode(d)) || []
        }
      }
    }
    default:
      throw new Error(`unknown prefix ${prefix}`)
  }
}

const utf8Encoder = new TextEncoder()
const utf8Decoder = new TextDecoder()

type TLV = { [t: number]: Uint8Array[] }

function parseTLV(data: Uint8Array): TLV {
  let result: TLV = {}
  let rest = data
  while (rest.length > 0) {
    let t = rest[0]
    let l = rest[1]
    let v = rest.slice(2, 2 + l)
    rest = rest.slice(2 + l)
    if (v.length < l) throw new Error(`not enough data for tlv ${t}`)
    result[t] = result[t] || []
    result[t].push(v)
  }
  return result
}

function encodeTLV(tlv: TLV): Uint8Array {
  let entries: Uint8Array[] = []
  for (let t in tlv) {
    for (let v of tlv[+t]) {
      entries.push(new Uint8Array([+t, v.length]), v)
    }
  }
  return concatBytes(...entries)
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  let totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
  let result = new Uint8Array(totalLength)
  let offset = 0
  for (let arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

export const Bech32MaxSize = 5000

/**
 * Bech32 regex.
 * @see https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#bech32
 */
export const BECH32_REGEX = /[\x21-\x7E]{1,83}1[023456789acdefghjklmnpqrstuvwxyz]{6,}/

function integerToUint8Array(number: number) {
  // Create a Uint8Array with enough space to hold a 32-bit integer (4 bytes).
  const uint8Array = new Uint8Array(4)

  // Use bitwise operations to extract the bytes.
  uint8Array[0] = (number >> 24) & 0xff // Most significant byte (MSB)
  uint8Array[1] = (number >> 16) & 0xff
  uint8Array[2] = (number >> 8) & 0xff
  uint8Array[3] = number & 0xff // Least significant byte (LSB)

  return uint8Array
}
