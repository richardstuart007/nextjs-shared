export function buildSql_Readable(sqlQuery: string, values: (string | number)[]): string {
  let readableSql = sqlQuery
  for (let i = values.length; i >= 1; i--) {
    const placeholder = `$${i}`
    const value = values[i - 1]
    readableSql = readableSql.replaceAll(placeholder, String(value))
  }
  return readableSql
}
