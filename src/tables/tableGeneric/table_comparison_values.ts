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

export const Comparison_values = [
  { optionLabel: 'Equal', optionValue: '=' },
  { optionLabel: 'Not Equal', optionValue: '<>' },
  { optionLabel: 'Like', optionValue: 'LIKE' },
  { optionLabel: 'Greater Than', optionValue: '>' },
  { optionLabel: 'Greater Than or Equal', optionValue: '>=' },
  { optionLabel: 'Less Than', optionValue: '<' },
  { optionLabel: 'Less Than or Equal', optionValue: '<=' },
  { optionLabel: 'In', optionValue: 'IN' },
  { optionLabel: 'Not In', optionValue: 'NOT IN' }
]
