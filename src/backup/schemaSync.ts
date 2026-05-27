'use server'

import { execSync } from 'child_process'
import { createClient, read_location, readEnvVar } from './dbClient'
import { fetchSchema, diffSchemas, type SchemaCompareResult } from './schemaUtils'

const PG_BIN_PATHS = [
  'C:\\Program Files\\PostgreSQL\\18\\bin',
  'C:\\Program Files\\PostgreSQL\\17\\bin',
  'C:\\Program Files\\PostgreSQL\\16\\bin',
  'C:\\Program Files\\PostgreSQL\\15\\bin',
]

function execPgDump(args: string): string {
  const augmentedPath = [...PG_BIN_PATHS, process.env.PATH ?? ''].join(';')
  return execSync(`pg_dump ${args}`, {
    encoding: 'utf8',
    env: { ...process.env, PATH: augmentedPath },
  }) as string
}

export type { SchemaCompareResult, DiffRow, ChangeRow, TableSummary, TableStatus } from './schemaUtils'

/** Connect to two databases and return a full schema diff including a per-table summary. */
export async function compareSchemas(env1: string, env2: string): Promise<SchemaCompareResult> {
  const c1 = await createClient(env1)
  const c2 = await createClient(env2)
  try {
    const [rows1, rows2] = await Promise.all([fetchSchema(c1), fetchSchema(c2)])
    const label1 = read_location(env1) || env1
    const label2 = read_location(env2) || env2
    return { label1, label2, ...diffSchemas(rows1, rows2, label1, label2) }
  } finally {
    await c1.end().catch(() => {})
    await c2.end().catch(() => {})
  }
}

export type ApplyResult = {
  ok: number
  errors: Array<{ sql: string; error: string }>
}

export type TableDDL = {
  table_name: string
  sql: string
}

function parsePgDumpByTable(raw: string): TableDDL[] {
  // Normalise Windows CRLF so all regex / split patterns work uniformly
  const text = raw.replace(/\r\n/g, '\n')
  const tableMap = new Map<string, string[]>()

  // First pass: build seqname → tablename map from OWNED BY statements
  const seqToTable = new Map<string, string>()
  const ownedRe = /ALTER SEQUENCE public\.(\S+)\s+OWNED BY public\.(\w+)\./g
  let om: RegExpExecArray | null
  while ((om = ownedRe.exec(text)) !== null) seqToTable.set(om[1], om[2])

  // Split into blocks on the section separator pattern
  const blocks = text.split(/\n--\n(?=-- Name:)/)

  for (const block of blocks) {
    const headerMatch = block.match(/^-- Name: ([^;]+); Type: ([^;]+);/)
    if (!headerMatch) continue
    const name = headerMatch[1].trim()
    const type = headerMatch[2].trim()

    // Skip SEQUENCE OWNED BY — already used above
    if (type === 'SEQUENCE OWNED BY') continue

    // Extract SQL: everything after the leading comment lines
    const lines = block.split('\n')
    let sqlStart = 0
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('--') && lines[i].trim() !== '') { sqlStart = i; break }
    }
    const sql = lines.slice(sqlStart).join('\n').trim()
    if (!sql) continue

    let tableName: string | null = null
    if (type === 'TABLE') {
      tableName = name
    } else if (type === 'CONSTRAINT' || type === 'DEFAULT') {
      tableName = name.split(' ')[0]
    } else if (type === 'SEQUENCE') {
      tableName = seqToTable.get(name) ?? null
      if (!tableName) {
        const m2 = sql.match(/ALTER TABLE public\.(\w+)/)
        if (m2) tableName = m2[1]
      }
    } else if (type === 'INDEX') {
      const m2 = sql.match(/ON public\.(\w+)/)
      if (m2) tableName = m2[1]
    }

    if (tableName) {
      if (!tableMap.has(tableName)) tableMap.set(tableName, [])
      tableMap.get(tableName)!.push(sql)
    }
  }

  return [...tableMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([table_name, sqls]) => ({ table_name, sql: sqls.join('\n\n') }))
}

/** Run pg_dump --schema-only against envFile's database and return per-table CREATE TABLE + index DDL. */
export async function generateCreateSQL(envFile: string): Promise<TableDDL[]> {
  const url = readEnvVar(envFile, 'POSTGRES_URL')
  if (!url) throw new Error('POSTGRES_URL not found in env file')
  const cleanUrl = url.replace(/[&?]timezone=[^&]*/g, '')
  let raw: string
  try {
    raw = execPgDump(`--schema-only --no-owner --no-acl "${cleanUrl}"`)
  } catch (e) {
    throw new Error(`pg_dump failed: ${(e as Error).message}`)
  }
  if (!raw.trim()) throw new Error('pg_dump returned empty output')
  const result = parsePgDumpByTable(raw)
  if (result.length === 0) {
    throw new Error(
      `pg_dump ran (${raw.length} chars) but no tables were parsed. ` +
      `First 300 chars: ${raw.slice(0, 300).replace(/\n/g, '↵')}`
    )
  }
  return result
}

/** Execute SQL statements (split by ';') against envFile's database; returns ok count and per-statement errors. */
export async function applySQL(envFile: string, sqlText: string): Promise<ApplyResult> {
  const client = await createClient(envFile)
  let ok = 0
  const errors: Array<{ sql: string; error: string }> = []
  try {
    const statements = sqlText
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        const nonComment = s.split('\n').filter(l => l.trim() && !l.trim().startsWith('--'))
        return nonComment.length > 0
      })
    for (const stmt of statements) {
      try {
        await client.query(stmt)
        ok++
      } catch (error) {
        errors.push({ sql: stmt, error: (error as Error).message })
      }
    }
  } finally {
    await client.end().catch(() => {})
  }
  return { ok, errors }
}
