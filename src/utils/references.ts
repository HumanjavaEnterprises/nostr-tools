import type { AddressPointer, ProfilePointer, EventPointer } from '../types/nips'
import { decode, NostrTypeGuard, Bech32ID } from '../nips/nip19'

import type { Event } from '../core'

type Reference = {
  text: string
  profile?: ProfilePointer
  event?: EventPointer
  address?: AddressPointer
}

const mentionRegex = /\bnostr:((note|npub|naddr|nevent|nprofile)1\w+)\b|#\[(\d+)\]/g

export function parseReferences(evt: Event): Reference[] {
  let references: Reference[] = []
  for (let ref of evt.content.matchAll(mentionRegex)) {
    if (ref[2]) {
      // it's a NIP-27 mention
      const parsedRef = tryParseReference(ref[1])
      if (parsedRef) {
        switch (parsedRef.type) {
          case 'npub': {
            references.push({
              text: ref[0],
              profile: { pubkey: parsedRef.data as string, relays: [] },
            })
            break
          }
          case 'nprofile': {
            references.push({
              text: ref[0],
              profile: parsedRef.data as ProfilePointer,
            })
            break
          }
          case 'note': {
            references.push({
              text: ref[0],
              event: { id: parsedRef.data as string, relays: [] },
            })
            break
          }
          case 'nevent': {
            references.push({
              text: ref[0],
              event: parsedRef.data as EventPointer,
            })
            break
          }
          case 'naddr': {
            references.push({
              text: ref[0],
              address: parsedRef.data as AddressPointer,
            })
            break
          }
        }
      }
    } else if (ref[3]) {
      // it's a NIP-10 mention
      let idx = parseInt(ref[3], 10)
      let tag = evt.tags[idx]
      if (!tag) continue

      switch (tag[0]) {
        case 'p': {
          references.push({
            text: ref[0],
            profile: { pubkey: tag[1], relays: tag[2] ? [tag[2]] : [] },
          })
          break
        }
        case 'e': {
          references.push({
            text: ref[0],
            event: { id: tag[1], relays: tag[2] ? [tag[2]] : [] },
          })
          break
        }
        case 'a': {
          try {
            let [kind, pubkey, identifier] = tag[1].split(':')
            references.push({
              text: ref[0],
              address: {
                identifier,
                pubkey,
                kind: parseInt(kind, 10),
                relays: tag[2] ? [tag[2]] : [],
              },
            })
          } catch (err) {
            /***/
          }
          break
        }
      }
    }
  }

  return references
}

export function tryParseReference(text: string): { type: string; data: any } | null {
  try {
    if (text.startsWith('nostr:')) {
      text = text.slice(6)
    }
    
    if (NostrTypeGuard.isNPub(text as Bech32ID) ||
        NostrTypeGuard.isNSec(text as Bech32ID) ||
        NostrTypeGuard.isNote(text as Bech32ID) ||
        NostrTypeGuard.isNProfile(text as Bech32ID) ||
        NostrTypeGuard.isNEvent(text as Bech32ID) ||
        NostrTypeGuard.isNAddr(text as Bech32ID)) {
      const { type, data } = decode(text as Bech32ID)
      return { type, data }
    }
    
    return null
  } catch (error) {
    return null
  }
}
