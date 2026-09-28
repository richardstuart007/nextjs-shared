//==============================================================================================
//  1) DESCRIPTION
//    buildCountQuery — builds a COUNT(*) version of a base SELECT * query, wrapping
//    in a subquery when DISTINCT ON is needed for an accurate count. Shared by
//    fetchTotalPages's cache-key build and table_fetch_pages_total's actual query
//    build.
//
//    Parameters:
//      sqlQuery        — a base 'SELECT * FROM ...' query (from buildSqlQuery)
//      distinctColumns — when non-empty, wraps sqlQuery in a DISTINCT ON subquery so
//                       the count reflects distinct rows, not raw matches
//
//    Returns:
//      the COUNT(*) query
//
//  3) CHANGE HISTORY
//    2026-09-28 — split out of buildSqlQuery.ts (one-export-per-file cleanup); no
//                 signature change
//==============================================================================================
export function buildCountQuery(sqlQuery: string, distinctColumns: string[] = []): string {
  if (distinctColumns.length > 0) {
    return `SELECT COUNT(*) FROM (${sqlQuery.replace(
      'SELECT *',
      `SELECT DISTINCT ON (${distinctColumns.join(', ')}) *`
    )}) AS distinct_records`
  }
  const result = sqlQuery.replace('SELECT *', 'SELECT COUNT(*)')
  return result
}
