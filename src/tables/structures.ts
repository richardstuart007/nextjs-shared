import { Comparison_operator } from './tableGeneric/table_comparison_values'
//
// Column-value pairs
//
export type ColumnValuePair = {
  column: string
  value: string | number | (string | number)[]
  operator?: Comparison_operator
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
  lg_caller: string
  lg_functionname: string
  lg_msg: string
  lg_datetime: Date
}
