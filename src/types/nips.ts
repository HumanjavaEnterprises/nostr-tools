// NIP-19 Types
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

export type DecodeResult = {
  type: string
  data: string | ProfilePointer | EventPointer | AddressPointer | Uint8Array
}

// NIP-11 Types
export type RelayInfo = {
  name?: string
  description?: string
  pubkey?: string
  contact?: string
  supported_nips?: number[]
  software?: string
  version?: string
  limitation?: {
    max_message_length?: number
    max_subscriptions?: number
    max_filters?: number
    max_limit?: number
    max_subid_length?: number
    min_prefix?: number
    max_event_tags?: number
    max_content_length?: number
    min_pow_difficulty?: number
    auth_required?: boolean
    payment_required?: boolean
  }
}

// NIP-05 Types
export const NIP05_REGEX = /^(?:([\w.+-]+)@)?([\w.-]+)$/

// NIP-44 Types
export type EncryptedData = {
  ciphertext: string
  nonce: string
}

export function getConversationKey(privkey: Uint8Array, pubkey: string): Uint8Array {
  return privkey
}
