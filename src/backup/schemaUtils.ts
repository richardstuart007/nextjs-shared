import { Client } from 'pg'

export type SchemaRow = {
  table_name: string
  column_name: string
  data_type: string
  max_len: number | null
  is_nullable: string
  column_default: string | null
  is_pk: boolean
  is_unique: boolean
  has_index: boolean
}

export type DiffRow = SchemaRow & { side: string }

export type ChangeRow = {
  table_name: string
  column_name: string
  source: SchemaRow
  target: SchemaRow
}

export type SchemaCompareResult = {
  label1: string
  label2: string
  onlyIn1: DiffRow[]
  onlyIn2: DiffRow[]
  changed: ChangeRow[]
}

export async function fetchSchema(client: Client): Promise<SchemaRow[]> {
  const result = await client.query<SchemaRow>(`
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.character_maximum_length AS max_len,
      c.is_nullable,
      c.column_default,
      EXISTS(
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
        WHERE tc.table_schema    = 'public'
          AND tc.constraint_type = 'PRIMARY KEY'
          AND kcu.table_name     = c.table_name
          AND kcu.column_name    = c.column_name
      ) AS is_pk,
      EXISTS(
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
        WHERE tc.table_schema    = 'public'
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.table_name     = c.table_name
          AND kcu.column_name    = c.column_name
      ) AS is_unique,
      EXISTS(
        SELECT 1 FROM pg_indexes ix
        WHERE ix.schemaname = 'public'
          AND ix.tablename  = c.table_name
          AND ix.indexdef  LIKE '%' || c.column_name || '%'
      ) AS has_index
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  `)
  return result.rows
}

export function diffSchemas(
  rows1: SchemaRow[],
  rows2: SchemaRow[],
  label1: string,
  label2: string
): Omit<SchemaCompareResult, 'label1' | 'label2'> {
  const key = (r: SchemaRow) => `${r.table_name}::${r.column_name}`
  const map1 = new Map(rows1.map(r => [key(r), r]))
  const map2 = new Map(rows2.map(r => [key(r), r]))

  const onlyIn1: DiffRow[] = rows1
    .filter(r => !map2.has(key(r)))
    .map(r => ({ ...r, side: label1 }))

  const onlyIn2: DiffRow[] = rows2
    .filter(r => !map1.has(key(r)))
    .map(r => ({ ...r, side: label2 }))

  const changed: ChangeRow[] = []
  for (const [k, src] of map1) {
    const tgt = map2.get(k)
    if (!tgt) continue
    if (
      src.data_type !== tgt.data_type ||
      src.max_len !== tgt.max_len ||
      src.is_nullable !== tgt.is_nullable ||
      src.column_default !== tgt.column_default
    ) {
      changed.push({ table_name: src.table_name, column_name: src.column_name, source: src, target: tgt })
    }
  }

  return { onlyIn1, onlyIn2, changed }
}

function buildTypeStr(col: SchemaRow): string {
  if ((col.data_type === 'character varying' || col.data_type === 'character') && col.max_len) {
    return col.data_type === 'character varying' ? `VARCHAR(${col.max_len})` : `CHAR(${col.max_len})`
  }
  return col.data_type.toUpperCase()
}

export function generateAlterSQL(result: SchemaCompareResult): string[] {
  const sqls: string[] = []

  for (const col of result.onlyIn1) {
    const typeStr = buildTypeStr(col)
    const nullStr = col.is_nullable === 'NO' ? ' NOT NULL' : ''
    const defStr = col.column_default ? ` DEFAULT ${col.column_default}` : ''
    sqls.push(`ALTER TABLE "${col.table_name}" ADD COLUMN IF NOT EXISTS "${col.column_name}" ${typeStr}${nullStr}${defStr};`)
  }

  for (const c of result.changed) {
    if (c.source.data_type !== c.target.data_type || c.source.max_len !== c.target.max_len) {
      const typeStr = buildTypeStr(c.source)
      sqls.push(`ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" TYPE ${typeStr} USING "${c.column_name}"::text::${typeStr};`)
    }
    if (c.source.is_nullable !== c.target.is_nullable) {
      sqls.push(
        c.source.is_nullable === 'NO'
          ? `ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" SET NOT NULL;`
          : `ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" DROP NOT NULL;`
      )
    }
    if (c.source.column_default !== c.target.column_default) {
      sqls.push(
        c.source.column_default
          ? `ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" SET DEFAULT ${c.source.column_default};`
          : `ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" DROP DEFAULT;`
      )
    }
  }

  for (const col of result.onlyIn2) {
    sqls.push(`-- Only in ${result.label2}, not in ${result.label1} — drop if intended:`)
    sqls.push(`-- ALTER TABLE "${col.table_name}" DROP COLUMN "${col.column_name}";`)
  }

  return sqls
}
