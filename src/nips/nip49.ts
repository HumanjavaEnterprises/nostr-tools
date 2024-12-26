import { scrypt } from '@noble/hashes/scrypt'
import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { concatBytes, randomBytes } from '@noble/hashes/utils'
import { bech32 } from '@scure/base'

export function encrypt(
  sec: Uint8Array,
  password: string,
  logn: number = 16,
  ksb: 0x00 | 0x01 | 0x02 = 0x02,
): string {
  let salt = randomBytes(16)
  let n = 2 ** logn
  let key = scrypt(password.normalize('NFKC'), salt, { N: n, r: 8, p: 1, dkLen: 32 })
  let nonce = randomBytes(24)
  let aad = new Uint8Array([ksb])
  let xc2p1 = xchacha20poly1305(key, nonce, aad)
  let ciphertext = xc2p1.encrypt(sec)
  let b = concatBytes(Uint8Array.from([0x02]), Uint8Array.from([logn]), salt, nonce, aad, ciphertext)
  
  return `ncryptsec1${bech32.encode('ncryptsec', bech32.toWords(b), 90).split('1')[1]}`
}

export function decrypt(ncryptsec: `${string}1${string}`, password: string): Uint8Array {
  try {
    let { prefix, words } = bech32.decode(ncryptsec, 90)
    if (prefix !== 'ncryptsec') {
      throw new Error(`invalid prefix ${prefix}, expected 'ncryptsec'`)
    }
    let b = bech32.fromWords(words)
    if (b[0] !== 0x02) {
      throw new Error(`invalid version ${b[0]}, expected 0x02`)
    }
    let logn = b[1]
    let n = 2 ** logn
    let salt = b.slice(2, 18)
    let nonce = b.slice(18, 42)
    let aad = b.slice(42, 43)
    let ciphertext = b.slice(43)
    let key = scrypt(password.normalize('NFKC'), salt, { N: n, r: 8, p: 1, dkLen: 32 })
    let xc2p1 = xchacha20poly1305(key, nonce, aad)
    let sec = xc2p1.decrypt(ciphertext)
    return sec
  } catch (error) {
    throw error
  }
}
