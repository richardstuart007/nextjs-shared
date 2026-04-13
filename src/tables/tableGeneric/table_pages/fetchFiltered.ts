'use server'

import { cache_get, cache_set } from '../../cache/userCache_store'
import {
  JoinParams,
  Filter,
  table_fetch_pages_filtered
} from './tableFetchUtils'
import { buildSql_Placeholders } from '../buildSql_Placeholders'
import { buildSql_Readable } from '../buildSql_Readable'
import { Comparison_operator } from '../table_comparison_values'

//---------------------------------------------------------------------
//  Helper function to convert filters to whereColumnValuePairs
//---------------------------------------------------------------------
function filtersToWhereColumnValuePairs(
  filters: Filter[]
): { column: string; value: any; operator?: Comparison_operator }[] {
  return filters.map(filter => ({
    column: filter.column,
    value: filter.value,
    operator: filter.operator as Comparison_operator
  }))
}

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
  caller
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  orderBy?: string
  limit?: number
  offset?: number
  distinctColumns?: string[]
  caller: string
}): Promise<any[]> {
  const functionName = 'fetchFiltered'

  const whereColumnValuePairs = filtersToWhereColumnValuePairs(filters)
  const { sqlQuery: sqlWithPlaceholders, values } = buildSql_Placeholders({
    table,
    whereColumnValuePairs,
    orderBy,
    distinct: distinctColumns.length > 0,
    columns: distinctColumns.length > 0 ? distinctColumns : undefined,
    limit
  })
  const readableSql = buildSql_Readable(sqlWithPlaceholders, values)
  const joinSuffix = joins.map(j => `JOIN ${j.table}`).join(' ')
  const baseCacheKey = joinSuffix ? `${readableSql} ${joinSuffix}` : readableSql
  const cacheKey = offset ? `${baseCacheKey} OFFSET ${offset}` : baseCacheKey

  const cachedData = cache_get<any>(cacheKey, functionName)
  if (cachedData) return cachedData

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
  cache_set(cacheKey, data, caller)
  return data
}
