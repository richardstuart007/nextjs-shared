'use server'

import { cache_get, cache_set } from '../../cache/userCache_store'
import {
  JoinParams,
  Filter,
  table_fetch_pages_total
} from './tableFetchUtils'
import { ITEMS_PER_PAGE } from './page_constants'
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
// Fetch Total Pages Function – also supports caching internally
//---------------------------------------------------------------------
export async function fetchTotalPages({
  table,
  joins = [],
  filters = [],
  items_per_page = ITEMS_PER_PAGE,
  distinctColumns = [],
  caller = '',
  skipCache = false
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  items_per_page?: number
  distinctColumns?: string[]
  caller: string
  skipCache?: boolean
}): Promise<number> {
  const functionName = 'fetchTotalPages'

  const whereColumnValuePairs = filtersToWhereColumnValuePairs(filters)
  const { sqlQuery: sqlWithPlaceholders, values } = buildSql_Placeholders({
    table,
    whereColumnValuePairs,
    distinct: distinctColumns.length > 0,
    columns: distinctColumns.length > 0 ? distinctColumns : undefined
  })
  const readableSql = buildSql_Readable(sqlWithPlaceholders, values)
  const joinSuffix = joins.map(j => `JOIN ${j.table}`).join(' ')
  const baseCacheKey = joinSuffix ? `${readableSql} ${joinSuffix}` : readableSql
  const cacheKey = `${baseCacheKey} | items_per_page: ${items_per_page} | type: totalPages`

  if (!skipCache) {
    const cachedData = cache_get<number>(cacheKey, functionName)
    if (cachedData !== null) return cachedData
  }

  const totalPages = await table_fetch_pages_total({
    table,
    joins,
    filters,
    items_per_page,
    distinctColumns,
    caller
  })
  if (!skipCache) {
    cache_set(cacheKey, totalPages, caller)
  }
  return totalPages
}
