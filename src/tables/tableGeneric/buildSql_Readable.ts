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
