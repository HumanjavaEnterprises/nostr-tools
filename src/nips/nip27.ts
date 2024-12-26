import { decode, NostrTypeGuard, Bech32ID, AddressPointer, EventPointer, ProfilePointer } from './nip19'
import { parse as parseNip21 } from './nip21'
import type { DecodeResult } from '../types/nips'

export type NostrURI = `nostr:${Bech32ID}`
export type NostrURIMatch = {
  uri: NostrURI
  value: Bech32ID
  decoded: DecodeResult
  start: number
  end: number
}

/** Nostr URI regex, eg `nostr:npub1...` */
export const NOSTR_URI_REGEX = /nostr:[\w-]+/g

/** Test whether the value contains a Nostr URI. */
export function test(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return NOSTR_URI_REGEX.test(value)
}

/** Parse and decode a Nostr URI. */
export function parse(uri: NostrURI): NostrURIMatch {
  const match = parseNip21(uri)
  return {
    uri: match.uri,
    value: match.value as Bech32ID,
    decoded: match.decoded,
    start: 0,
    end: uri.length
  }
}

/** Find and decode all NIP-21 URIs. */
export function* matchAll(content: string): Iterable<NostrURIMatch> {
  const matches = content.matchAll(NOSTR_URI_REGEX)
  for (const match of matches) {
    const uri = match[0]
    const value = uri.replace('nostr:', '')
    if (match.index !== undefined) {
      yield {
        uri: uri as NostrURI,
        value: value as Bech32ID,
        decoded: decode(value as Bech32ID),
        start: match.index,
        end: match.index + uri.length,
      }
    }
  }
}

/** Replace all occurrences of Nostr URIs in the text. */
export function replaceAll(content: string, replacer: (match: NostrURIMatch) => string): string {
  return content.replaceAll(NOSTR_URI_REGEX, (uri, _, index) => {
    const value = uri.replace('nostr:', '')
    return replacer({
      uri: uri as NostrURI,
      value: value as Bech32ID,
      decoded: decode(value as Bech32ID),
      start: index,
      end: index + uri.length
    })
  })
}

export function handleMentions(text: string): string {
  return text.replace(/\b(nostr:)?(@|npub|note|naddr|nevent|nprofile)1[023456789acdefghjklmnpqrstuvwxyz]+\b/g, (tag) => {
    try {
      tag = tag.replace('nostr:', '')
      if (tag.startsWith('@')) {
        tag = tag.slice(1)
      }
      if (NostrTypeGuard.isNPub(tag as Bech32ID)) {
        const { data: pubkey } = decode(tag as Bech32ID)
        return (`nostr:${tag}` as NostrURI) + ` #[${pubkey}]`
      }
      if (NostrTypeGuard.isNote(tag as Bech32ID)) {
        const { data: id } = decode(tag as Bech32ID)
        return (`nostr:${tag}` as NostrURI) + ` #[${id}]`
      }
      if (NostrTypeGuard.isNAddr(tag as Bech32ID)) {
        const { data } = decode(tag as Bech32ID)
        const addr = data as AddressPointer
        return (`nostr:${tag}` as NostrURI) + ` #[${addr.kind}:${addr.pubkey}:${addr.identifier}]`
      }
      if (NostrTypeGuard.isNEvent(tag as Bech32ID)) {
        const { data } = decode(tag as Bech32ID)
        const event = data as EventPointer
        return (`nostr:${tag}` as NostrURI) + ` #[${event.id}]`
      }
      if (NostrTypeGuard.isNProfile(tag as Bech32ID)) {
        const { data } = decode(tag as Bech32ID)
        const profile = data as ProfilePointer
        return (`nostr:${tag}` as NostrURI) + ` #[${profile.pubkey}]`
      }
      return tag
    } catch (err) {
      return tag
    }
  })
}
