'use server'

import { cache_get, cache_set } from '../../cache/userCache_store'
import { buildSqlQuery, buildCountQuery } from './buildSqlQuery'
import type { JoinParams, Filter } from '../../structures'
import { table_fetch_rows_total } from './tableFetchUtils'
import { buildSql_Readable } from '../buildSql_Readable'

//---------------------------------------------------------------------
// Fetch Total Rows Function – actual row count (no page-size division),
// also supports caching internally. Cache key is ROWS::-prefixed so it
// can't collide with fetchTotalPages's cache entry for the same SQL.
//---------------------------------------------------------------------
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
}): Promise<number> {
  const functionName = 'fetchTotalRows'

  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })
  const countSql = buildCountQuery(sqlQuery, distinctColumns)
  const cacheKey = `ROWS::${buildSql_Readable(countSql, queryValues)}`

  if (!skipCache) {
    const cachedData = cache_get<number>(cacheKey, functionName, table, level, severity)
    if (cachedData !== null) return cachedData
  }

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
  return totalRows
}
