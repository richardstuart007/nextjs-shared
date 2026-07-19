'use server'

import { cache_get, cache_set } from '../../cache/userCache_store'
import { buildSqlQuery, applyFetchSuffix } from './buildSqlQuery'
import type { JoinParams, Filter } from '../../structures'
import { table_fetch_pages_filtered } from './tableFetchUtils'
import { buildSql_Readable } from '../buildSql_Readable'

//---------------------------------------------------------------------
// Fetch Filtered Function – decides internally whether to cache
//---------------------------------------------------------------------
export async function fetchFiltered({
  table,
  joins = [],
  filters = [],
  orderBy,
  limit,
  offset,
  distinctColumns = [],
  caller,
  skipCache = false,
  level = 1,
  severity = 'I'
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  orderBy?: string
  limit?: number
  offset?: number
  distinctColumns?: string[]
  caller: string
  skipCache?: boolean
  level?: number
  severity?: string
}): Promise<any[]> {
  const functionName = 'fetchFiltered'

  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })
  const cacheKeySql = applyFetchSuffix(sqlQuery, { distinctColumns, orderBy, limit, offset })
  const cacheKey = buildSql_Readable(cacheKeySql, queryValues)

  if (!skipCache) {
    const cachedData = cache_get<any>(cacheKey, functionName, table, level, severity)
    if (cachedData) return cachedData
  }

  const data = await table_fetch_pages_filtered({
    table,
    joins,
    filters,
    orderBy,
    limit,
    offset,
    distinctColumns,
    caller,
    level,
    severity
  })
  if (!skipCache) {
    cache_set(cacheKey, data, caller, table, level, severity)
  }
  return data
}
