import { EventTemplate } from '../core'
import { ClientAuth } from '../types/kinds'

/**
 * creates an EventTemplate for an AUTH event to be signed.
 */
export function makeAuthEvent(relayURL: string, challenge: string): EventTemplate {
  return {
    kind: ClientAuth,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['relay', relayURL],
      ['challenge', challenge],
    ],
    content: '',
  }
}
