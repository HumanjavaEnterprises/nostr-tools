import { test, expect } from '../helpers/test-utils'
import { v2 } from '../../nips/nip44.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import vectors from '../nip44.vectors.json'
import { schnorr } from '@noble/curves/secp256k1'
const v2vec = vectors.v2

test.skip('get_conversation_key', () => {
  for (const v of v2vec.valid.get_conversation_key) {
    const key = v2.utils.getConversationKey(hexToBytes(v.sec1), v.pub2)
    expect(bytesToHex(key)).toEqual(v.conversation_key)
  }
})

test.skip('encrypt_decrypt', () => {
  for (const v of v2vec.valid.encrypt_decrypt) {
    const pub2 = bytesToHex(schnorr.getPublicKey(v.sec2))
    const key = v2.utils.getConversationKey(hexToBytes(v.sec1), pub2)
    expect(bytesToHex(key)).toEqual(v.conversation_key)
    const ciphertext = v2.encrypt(v.plaintext, key, hexToBytes(v.nonce))
    expect(ciphertext).toEqual(v.payload)
    const plaintext = v2.decrypt(ciphertext, key)
    expect(plaintext).toEqual(v.plaintext)
  }
})

test.skip('calc_padded_len', () => {
  for (const [len, shouldBePaddedTo] of v2vec.valid.calc_padded_len) {
    const actual = v2.utils.calcPaddedLen(len)
    expect(actual).toEqual(shouldBePaddedTo)
  }
})

test.skip('decrypt', () => {
  for (const v of v2vec.invalid.decrypt) {
    expect(() => v2.decrypt(v.payload, hexToBytes(v.conversation_key))).toThrow()
  }
})

test.skip('get_conversation_key', async () => {
  for (const v of v2vec.invalid.get_conversation_key) {
    expect(() => v2.utils.getConversationKey(hexToBytes(v.sec1), v.pub2)).toThrow(
      /(Point is not on curve|Cannot find square root)/,
    )
  }
})
