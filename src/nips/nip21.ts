import { decode, NostrTypeGuard, Bech32ID } from './nip19'
import type { DecodeResult } from '../types/nips'

/** Nostr URI regex, eg `nostr:npub1...` */
export const NOSTR_URI_REGEX = /nostr:[\w-]+/g

/** Test whether the value is a Nostr URI. */
export function test(value: unknown): value is `nostr:${string}` {
  if (typeof value !== 'string') return false
  return NOSTR_URI_REGEX.test(value)
}

export type NostrURI = `nostr:${Bech32ID}`

/** Match result for a Nostr URI in event content. */
type NostrURIMatch = {
  /** The complete URI (eg `nostr:npub1...`). */
  uri: NostrURI
  /** The bech32-encoded data (eg `npub1...`). */
  value: string
  /** Decoded bech32 string, according to NIP-19. */
  decoded: DecodeResult
}

/** Parse and decode a Nostr URI. */
export function parse(uri: string): NostrURIMatch {
  if (!uri.toLowerCase().startsWith('nostr:')) {
    throw new Error('Invalid nostr URI')
  }

  const value = uri.slice(6)
  if (!value) {
    throw new Error('Invalid nostr URI: no data after nostr:')
  }

  // Validate the value is a valid bech32 string
  if (NostrTypeGuard.isNPub(value as Bech32ID) ||
      NostrTypeGuard.isNSec(value as Bech32ID) ||
      NostrTypeGuard.isNote(value as Bech32ID) ||
      NostrTypeGuard.isNProfile(value as Bech32ID) ||
      NostrTypeGuard.isNEvent(value as Bech32ID) ||
      NostrTypeGuard.isNAddr(value as Bech32ID)) {
    return {
      uri: `nostr:${value}` as NostrURI,
      value,
      decoded: decode(value as Bech32ID)
    }
  }

  throw new Error('Invalid nostr URI: not a valid bech32 string')
}
