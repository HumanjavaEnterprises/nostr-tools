import { test, expect } from '../helpers/test-utils'
import { matchAll, replaceAll } from '../../nips/nip30'

it('matchAll', () => {
  const result = matchAll('Hello :blobcat: :disputed: ::joy:joy:')

  expect([...result]).toEqual([
    {
      name: 'blobcat',
      shortcode: ':blobcat:',
      start: 6,
      end: 15,
    },
    {
      name: 'disputed',
      shortcode: ':disputed:',
      start: 16,
      end: 26,
    },
  ])
})

it('replaceAll', () => {
  const content = 'Hello :blobcat: :disputed: ::joy:joy:'

  const result = replaceAll(content, ({ name }) => {
    return `<img src="https://ditto.pub/emoji/${name}.png" />`
  })

  expect(result).toEqual(
    'Hello <img src="https://ditto.pub/emoji/blobcat.png" /> <img src="https://ditto.pub/emoji/disputed.png" /> ::joy:joy:',
  )
})
