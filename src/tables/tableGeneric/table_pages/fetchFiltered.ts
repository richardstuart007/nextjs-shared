'use server'

import { cache_get, cache_set } from '../../cache/userCache_store'
import {
  JoinParams,
  Filter,
  table_fetch_pages_filtered,
  buildSqlQuery
} from './tableFetchUtils'
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
  skipCache = false
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
}): Promise<any[]> {
  const functionName = 'fetchFiltered'

  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })
  let cacheKeySql = sqlQuery
  if (distinctColumns.length > 0) {
    cacheKeySql = cacheKeySql.replace(
      'SELECT *',
      `SELECT DISTINCT ON (${distinctColumns.join(', ')}) *`
    )
  }
  if (orderBy) cacheKeySql += ` ORDER BY ${orderBy}`
  if (limit !== undefined) cacheKeySql += ` LIMIT ${limit}`
  if (offset !== undefined) cacheKeySql += ` OFFSET ${offset}`
  const cacheKey = buildSql_Readable(cacheKeySql, queryValues)

  if (!skipCache) {
    const cachedData = cache_get<any>(cacheKey, functionName)
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
    caller
  })
  if (!skipCache) {
    cache_set(cacheKey, data, caller)
  }
  return data
}
