/* global WebSocket */

import { verifyEvent } from '../core/pure'
import { AbstractSimplePool } from '../relay/abstract-pool'

var _WebSocket: typeof WebSocket

try {
  _WebSocket = WebSocket
} catch {}

export function useWebSocketImplementation(websocketImplementation: any) {
  _WebSocket = websocketImplementation
}

export class SimplePool extends AbstractSimplePool {
  constructor() {
    super({ verifyEvent, websocketImplementation: _WebSocket })
  }
}

export * from '../relay/abstract-pool'
