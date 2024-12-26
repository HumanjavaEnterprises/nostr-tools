import type { Event } from '../core'

export function searchEvent(event: Event, query: string): boolean {
  const content = event.content.toLowerCase()
  const searchTerms = query.toLowerCase().split(/\s+/)
  return searchTerms.every(term => content.includes(term))
}
