'use server'

import { cache_get, cache_set } from '../../cache/userCache_store'
import { buildSqlQuery, buildCountQuery } from './buildSqlQuery'
import type { JoinParams, Filter } from '../../structures'
import { TableResult } from '../../structures'
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
}): Promise<TableResult<number>> {
  const functionName = 'fetchTotalPages'

  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })
  const countSql = buildCountQuery(sqlQuery, distinctColumns)
  const cacheKey = buildSql_Readable(countSql, queryValues)

  if (!skipCache) {
    const cachedData = cache_get<number>(cacheKey, functionName, table, level, severity)
    if (cachedData !== null) return { ok: true, data: cachedData, error: null }
  }

  try {
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
    return { ok: true, data: totalPages, error: null }
  } catch (error) {
    return { ok: false, data: 0, error: (error as Error).message }
  }
}
