//==============================================================================================
//  1) DESCRIPTION
//    applyFetchSuffix — applies DISTINCT ON / ORDER BY / LIMIT / OFFSET to a base
//    SELECT * query, shared by fetchFiltered's cache-key build and
//    table_fetch_pages_filtered's actual query build.
//
//    Parameters:
//      sqlQuery        — a base 'SELECT * FROM ...' query (from buildSqlQuery)
//      queryValues     — that query's existing placeholder values
//      distinctColumns — optional columns for SELECT DISTINCT ON
//      orderBy         — optional ORDER BY clause
//      limit, offset   — optional pagination
//
//    Returns:
//      finalQuery  — the query with DISTINCT ON/ORDER BY/LIMIT/OFFSET applied
//      queryValues — queryValues with limit/offset appended, if supplied
//
//  2) NOTES
//    LIMIT/OFFSET are bound as $N params (they're values); ORDER BY/DISTINCT ON stay
//    string-interpolated since they're column names/expressions, not bindable values.
//
//  3) CHANGE HISTORY
//    2026-09-28 — split out of buildSqlQuery.ts (one-export-per-file cleanup); no
//                 signature change
//==============================================================================================
export function applyFetchSuffix(
  sqlQuery: string,
  queryValues: (string | number)[],
  {
    distinctColumns = [],
    orderBy,
    limit,
    offset
  }: {
    distinctColumns?: string[]
    orderBy?: string
    limit?: number
    offset?: number
  }
): { finalQuery: string; queryValues: (string | number)[] } {
  let finalQuery = sqlQuery
  const updatedValues = [...queryValues]
  if (distinctColumns.length > 0) {
    finalQuery = finalQuery.replace(
      'SELECT *',
      `SELECT DISTINCT ON (${distinctColumns.join(', ')}) *`
    )
  }
  if (orderBy) finalQuery += ` ORDER BY ${orderBy}`
  if (limit !== undefined) {
    updatedValues.push(limit)
    finalQuery += ` LIMIT $${updatedValues.length}`
  }
  if (offset !== undefined) {
    updatedValues.push(offset)
    finalQuery += ` OFFSET $${updatedValues.length}`
  }
  return { finalQuery, queryValues: updatedValues }
}
