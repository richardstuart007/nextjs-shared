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
  lg_caller: string
  lg_functionname: string
  lg_msg: string
  lg_datetime: Date
}
export type WriteLoggingProps = {
  lg_functionname: string
  lg_msg: string
  lg_severity?: string
  lg_level?: number
  lg_caller: string
}
