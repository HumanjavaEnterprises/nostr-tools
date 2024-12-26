import { describe, test, expect } from '../helpers/test-utils'
import fetch from 'node-fetch'
import { useFetchImplementation, fetchRelayInformation } from '../../nips/nip11'

// TODO: replace with a mock
describe('requesting relay as for NIP11', () => {
  useFetchImplementation(fetch)

  it('testing a relay', async () => {
    const info = await fetchRelayInformation('wss://nos.lol')
    expect(info.name).toEqual('nos.lol')
    expect(info.description).toContain('Generally accepts notes, except spammy ones.')
    expect(info.supported_nips).toEqual([1, 2, 4, 9, 11, 12, 16, 20, 22, 28, 33, 40])
    expect(info.software).toEqual('git+https://github.com/hoytech/strfry.git')
  })
})
