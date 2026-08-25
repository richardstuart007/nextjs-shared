'use server'

//==============================================================================================
//  1) DESCRIPTION
//    fetchTotalRows — actual row count (no page-size division), also supports caching
//    internally. Cache key is ROWS::-prefixed so it can't collide with fetchTotalPages's cache
//    entry for the same SQL.
//
//    Parameters:
//      table           — table name
//      joins           — optional joins, merged into the base query
//      filters         — optional WHERE filters
//      distinctColumns — optional DISTINCT columns for the count
//      caller          — logging caller identity
//      skipCache       — bypasses the cache read/write; defaults to false
//      level, severity — logging level/severity; default 1/'I'
//
//    Returns:
//      a TableResult<number> — the total row count, or an error message
//==============================================================================================

import { cache_get, cache_set } from '../../cache/userCache_store'
import { buildSqlQuery, buildCountQuery } from './buildSqlQuery'
import type { JoinParams, Filter } from '../../structures'
import { TableResult } from '../../structures'
import { table_fetch_rows_total } from './tableFetchUtils'
import { buildSql_Readable } from '../buildSql_Readable'

export async function fetchTotalRows({
  table,
  joins = [],
  filters = [],
  distinctColumns = [],
  caller = '',
  skipCache = false,
  level = 1,
  severity = 'I'
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  distinctColumns?: string[]
  caller: string
  skipCache?: boolean
  level?: number
  severity?: string
}): Promise<TableResult<number>> {
  const functionName = 'fetchTotalRows'

  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })
  const countSql = buildCountQuery(sqlQuery, distinctColumns)
  const cacheKey = `ROWS::${buildSql_Readable(countSql, queryValues)}`

  if (!skipCache) {
    const cachedData = cache_get<number>(cacheKey, functionName, table, level, severity)
    if (cachedData !== null) return { ok: true, data: cachedData, error: null }
  }

  try {
    const totalRows = await table_fetch_rows_total({
      table,
      joins,
      filters,
      distinctColumns,
      caller,
      level,
      severity
    })
    if (!skipCache) {
      cache_set(cacheKey, totalRows, caller, table, level, severity)
    }
    return { ok: true, data: totalRows, error: null }
  } catch (error) {
    return { ok: false, data: 0, error: (error as Error).message }
  }
}
