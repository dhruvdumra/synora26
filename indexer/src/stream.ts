import { EventEmitter } from 'node:events'

export interface SyncUpdate {
  block: string
  passes: number[]
  kinds: string[]
}

/** One in-process bus: the sync loop publishes, connected browsers listen over server-sent events. */
export const updates = new EventEmitter<{ update: [SyncUpdate] }>()
updates.setMaxListeners(0)
