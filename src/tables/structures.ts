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
