'use server'

import {
  cache_clearAll,
  cache_deleteEntry,
  cache_getEntriesInfo,
  cache_getEntryData,
  CacheEntryInfo
} from './userCache_store'
import { write_logging } from '../tableGeneric/write_logging'

const functionName = 'cache_actions'

export async function cacheAction_clearAll(
  caller: string = functionName,
  level: number = 1,
  severity: string = 'I'
) {
  cache_clearAll(caller, level, severity)
  write_logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: 'CACHE_CLR_ALL | Admin triggered',
    lg_severity: severity,
    lg_level: level
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
  caller: string = functionName,
  level: number = 1,
  severity: string = 'I'
): Promise<boolean> {
  return cache_deleteEntry(sql, caller, level, severity)
}
