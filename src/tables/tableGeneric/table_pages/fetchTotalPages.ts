'use server'

import { cache_get, cache_set } from '../../cache/userCache_store'
import { buildSqlQuery } from './buildSqlQuery'
import type { JoinParams, Filter } from '../../structures'
import { table_fetch_pages_total } from './tableFetchUtils'
import { ITEMS_PER_PAGE } from './page_constants'
import { buildSql_Readable } from '../buildSql_Readable'

//---------------------------------------------------------------------
// Fetch Total Pages Function – also supports caching internally
//---------------------------------------------------------------------
export async function fetchTotalPages({
  table,
  joins = [],
  filters = [],
  items_per_page = ITEMS_PER_PAGE,
  distinctColumns = [],
  caller = '',
  skipCache = false,
  level = 1,
  severity = 'I'
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  items_per_page?: number
  distinctColumns?: string[]
  caller: string
  skipCache?: boolean
  level?: number
  severity?: string
}): Promise<number> {
  const functionName = 'fetchTotalPages'

  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })
  let countSql: string
  if (distinctColumns.length > 0) {
    countSql = `SELECT COUNT(*) FROM (${sqlQuery.replace(
      'SELECT *',
      `SELECT DISTINCT ON (${distinctColumns.join(', ')}) *`
    )}) AS distinct_records`
  } else {
    countSql = sqlQuery.replace('SELECT *', 'SELECT COUNT(*)')
  }
  const cacheKey = buildSql_Readable(countSql, queryValues)

  if (!skipCache) {
    const cachedData = cache_get<number>(cacheKey, functionName, table, level, severity)
    if (cachedData !== null) return cachedData
  }

  const totalPages = await table_fetch_pages_total({
    table,
    joins,
    filters,
    items_per_page,
    distinctColumns,
    caller,
    level,
    severity
  })
  if (!skipCache) {
    cache_set(cacheKey, totalPages, caller, table, level, severity)
  }
  return totalPages
}
