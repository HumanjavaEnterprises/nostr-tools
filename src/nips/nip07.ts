import { EventTemplate, NostrEvent } from '../core'
import { RelayRecord } from '../relay'

export interface WindowNostr {
  getPublicKey(): Promise<string>
  signEvent(event: EventTemplate): Promise<NostrEvent>
  getRelays(): Promise<RelayRecord>
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
}
