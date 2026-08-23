//
//  Uniform result shape for every tableGeneric function — never thrown, always returned, so a
//  caller can check `ok`/`error` instead of wrapping every call in try/catch
//
export type TableResult<T> = {
  ok: boolean
  data: T
  error: string | null
}
//
// Comparison operators
//
export type Comparison_operator =
  | '='
  | '<>'
  | 'LIKE'
  | 'NOT LIKE'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'IN'
  | 'NOT IN'
  | 'IS NULL'
  | 'IS NOT NULL'
  | 'ARRAY_OVERLAP'
//
// Column-value pairs
//
export type ColumnValuePair = {
  column: string
  value: string | number | boolean | null | (string | number)[]
  operator?: Comparison_operator
}
export type WriteColumnValuePair = {
  column: string
  value: string | number | boolean | null | string[] | number[]
}
export type TableColumnValuePairs = {
  table: string
  whereColumnValuePairs: ColumnValuePair[]
}
//
// Join and filter params
//
export type JoinParams = {
  table: string
  on: string
}
export type Filter = {
  column: string
  operator: Comparison_operator
  value: string | number | (string | number)[]
}
//
//  Logging table structure
//
export type table_Logging = {
  lg_lgid: number
  lg_severity: string
  lg_level: number
  lg_isupdate: boolean
  lg_caller: string
  lg_functionname: string
  lg_dbkey: string | null
  lg_table: string
  lg_msg: string
  lg_datetime: Date
  lg_sql_raw: string | null
  lg_sql_params: any
  lg_sql_readable: string | null
}
export type WriteLoggingProps = {
  lg_functionname: string
  lg_dbkey?: string | null
  lg_table?: string
  lg_msg: string
  lg_severity?: string
  lg_level?: number
  lg_isupdate?: boolean
  lg_caller: string
  lg_sql_raw?: string
  lg_sql_params?: any[]
  lg_sql_readable?: string
}
//
//  Routing control table structure — maps a table name to the dbKey it's routed to
//
export type table_Routing = {
  rtg_rtgid: number
  rtg_table: string
  rtg_dbkey: string
}
//
//  Multi-database routing test table structure
//
export type table_Test = {
  tst_tstid: number
  tst_note: string | null
}
