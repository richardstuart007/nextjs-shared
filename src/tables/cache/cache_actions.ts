'use server'

import {
  cache_clearAll,
  cache_deleteEntry,
  cache_getEntriesInfo,
  cache_getEntryData,
  CacheEntriesPage
} from './userCache_store'
import { write_logging } from '../tableGeneric/write_logging'

const functionName = 'cache_actions'

//----------------------------------------------------------------------------------
//  cacheAction_clearAll — clears every entry from userCache_store and logs it
//
//  Params:
//    caller   — logging caller identity; defaults to this module's own name
//    level    — log level; defaults to 1
//    severity — log severity; defaults to 'I'
//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
//  cacheAction_getEntries — a filtered, paginated page of cache entry summaries
//
//  Params:
//    limit, offset                        — pagination
//    keyFilter, tableFilter, callerFilter — optional substring filters
//
//  Returns:
//    the matching page of entries plus totalCount/overallSize (see CacheEntriesPage)
//----------------------------------------------------------------------------------
export async function cacheAction_getEntries({
  limit,
  offset,
  keyFilter,
  tableFilter,
  callerFilter
}: {
  limit: number
  offset: number
  keyFilter?: string
  tableFilter?: string
  callerFilter?: string
}): Promise<CacheEntriesPage> {
  return cache_getEntriesInfo({ limit, offset, keyFilter, tableFilter, callerFilter })
}

//----------------------------------------------------------------------------------
//  cacheAction_getEntryData — the full cached value for one entry
//
//  Params:
//    sql — the entry's cache key (the SQL string)
//
//  Returns:
//    the cached value
//----------------------------------------------------------------------------------
export async function cacheAction_getEntryData(sql: string): Promise<any> {
  return cache_getEntryData(sql)
}

//----------------------------------------------------------------------------------
//  cacheAction_deleteEntry — deletes one cache entry and logs it
//
//  Params:
//    sql      — the entry's cache key (the SQL string)
//    caller   — logging caller identity; defaults to this module's own name
//    level    — log level; defaults to 1
//    severity — log severity; defaults to 'I'
//
//  Returns:
//    whether an entry was actually found and removed
//----------------------------------------------------------------------------------
export async function cacheAction_deleteEntry(
  sql: string,
  caller: string = functionName,
  level: number = 1,
  severity: string = 'I'
): Promise<boolean> {
  return cache_deleteEntry(sql, caller, level, severity)
}
