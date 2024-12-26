import { PrivateDirectMessage } from '../types/kinds'
import { EventTemplate, NostrEvent, getPublicKey, generateSecretKey } from '../core/pure'
import { searchEvent } from '../utils/search'

type Recipient = {
  publicKey: string
  relayUrl?: string
}

type ReplyTo = {
  eventId: string
  relayUrl?: string
}

function createEvent(
  recipient: Recipient, 
  message: string, 
  conversationTitle?: string, 
  replyTo?: ReplyTo
): NostrEvent {
  const secretKey = generateSecretKey()
  const pubkey = getPublicKey(secretKey)
  const event: NostrEvent = {
    kind: PrivateDirectMessage,
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', recipient.publicKey]],
    content: message,
    id: '',
    sig: ''
  }
  
  if (replyTo) {
    event.tags.push(['e', replyTo.eventId, replyTo.relayUrl || '', 'reply'])
  }

  if (conversationTitle) {
    event.tags.push(['subject', conversationTitle])
  }

  return event
}

export function wrapEvent(
  senderPrivateKey: Uint8Array, 
  recipient: Recipient, 
  message: string, 
  conversationTitle?: string, 
  replyTo?: ReplyTo,
): NostrEvent {
  const event = createEvent(recipient, message, conversationTitle, replyTo)
  return event
}

export function wrapManyEvents(
  senderPrivateKey: Uint8Array,
  recipients: Recipient[],
  message: string,
  conversationTitle?: string,
  replyTo?: ReplyTo,
): NostrEvent[] {
  if (!recipients || recipients.length === 0) {
    throw new Error('At least one recipient is required.')
  }

  const senderPublicKey = getPublicKey(senderPrivateKey)

  // wrap the event for the sender and then for each recipient
  return [{ publicKey: senderPublicKey }, ...recipients].map(recipient =>
    wrapEvent(senderPrivateKey, recipient, message, conversationTitle, replyTo),
  )
}

export const unwrapEvent = (event: NostrEvent) => event

export const unwrapManyEvents = (events: NostrEvent[]) => events
