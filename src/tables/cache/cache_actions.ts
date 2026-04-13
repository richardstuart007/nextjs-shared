'use server'

import {
  cache_clearAll,
  cache_deleteEntry,
  cache_getEntriesInfo,
  cache_getEntryData,
  CacheEntryInfo
} from './userCache_store'
import { write_Logging } from '../tableGeneric/write_logging'

const functionName = 'cache_actions'

export async function cacheAction_clearAll(caller: string = functionName) {
  cache_clearAll(caller)
  write_Logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: 'CACHE_CLR_ALL | Admin triggered',
    lg_severity: 'I'
  })
}

export async function cacheAction_getEntries(): Promise<CacheEntryInfo[]> {
  return cache_getEntriesInfo()
}

export async function cacheAction_getEntryData(sql: string): Promise<any> {
  return cache_getEntryData(sql)
}

export async function cacheAction_deleteEntry(
  sql: string,
  caller: string = functionName
): Promise<boolean> {
  return cache_deleteEntry(sql, caller)
}
