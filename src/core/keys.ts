import { bytesToHex } from '@noble/hashes/utils'
import { schnorr } from '@noble/curves/secp256k1'
import { randomBytes } from '@noble/hashes/utils'

export function generateSecretKey(): Uint8Array {
  return randomBytes(32)
}

export function getPublicKey(secretKey: Uint8Array): string {
  return bytesToHex(schnorr.getPublicKey(secretKey))
}
