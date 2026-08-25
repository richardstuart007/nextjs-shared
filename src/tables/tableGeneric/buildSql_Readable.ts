//==============================================================================================
//  1) DESCRIPTION
//    buildSql_Readable — substitutes $1/$2/... placeholders in sqlQuery with their literal
//    values, for display/logging purposes only (not for execution)
//
//    Parameters:
//      sqlQuery — a parameterized SQL string using $1, $2, ... placeholders
//      values   — the values corresponding to each placeholder, in order
//
//    Returns:
//      sqlQuery with every placeholder replaced by its literal (quoted strings, NULL for
//      null, bare String(value) otherwise)
//==============================================================================================

export function buildSql_Readable(sqlQuery: string, values: any[]): string {
  let readableSql = sqlQuery
  for (let i = values.length; i >= 1; i--) {
    const placeholder = `$${i}`
    const value = values[i - 1]
    const literal =
      value === null
        ? 'NULL'
        : typeof value === 'string'
          ? `'${value.replace(/'/g, "''")}'`
          : String(value)
    readableSql = readableSql.replaceAll(placeholder, literal)
  }
  return readableSql
}
