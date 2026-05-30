'use server'

import { execSync } from 'child_process'
import { read_location, readEnvVar } from './dbClient'
import { sql } from '../tables/db'
import { createArbitraryDb } from '../tables/dbArbitrary'
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

/** Connect to two databases and return a full schema diff. excludePrefixes: comma-separated table-name prefixes to silently ignore (e.g. "bk_,tmp_"). */
export async function compareSchemas(env1: string, env2: string, excludePrefixes = 'bk_,local_,prod_,dev_'): Promise<SchemaCompareResult> {
  const url1 = readEnvVar(env1, 'POSTGRES_URL')
  const url2 = readEnvVar(env2, 'POSTGRES_URL')
  if (!url1) throw new Error(`POSTGRES_URL not found in ${env1}`)
  if (!url2) throw new Error(`POSTGRES_URL not found in ${env2}`)
  const db1 = createArbitraryDb(url1)
  const db2 = createArbitraryDb(url2)
  const [rows1, rows2] = await Promise.all([fetchSchema(db1), fetchSchema(db2)])
  const label1 = read_location(env1) || env1
  const label2 = read_location(env2) || env2
  const prefixes = excludePrefixes.split(',').map(p => p.trim()).filter(Boolean)
  const exclude = (table: string) => prefixes.some(p => table.startsWith(p))
  const filtered1 = rows1.filter(r => !exclude(r.table_name))
  const filtered2 = rows2.filter(r => !exclude(r.table_name))
  const diff = diffSchemas(filtered1, filtered2, label1, label2)
  return { label1, label2, ...diff }
}

/** Count rows for the given table names in the current database (via db.ts). Tables that do not exist are omitted from the result. */
export async function fetchTableCounts(tables: string[]): Promise<Record<string, number>> {
  if (tables.length === 0) return {}
  const db = await sql()
  const checkResult = await db.query({
    query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    params: [tables],
    functionName: 'fetchTableCounts',
    caller: 'schemaSync',
    noLog: true,
  })
  const existing: string[] = checkResult.rows.map((r: { table_name: string }) => r.table_name)
  if (existing.length === 0) return {}
  const unions = existing.map(t => `SELECT '${t}'::text AS t, COUNT(*) AS c FROM public."${t}"`).join(' UNION ALL ')
  const countResult = await db.query({
    query: unions,
    params: [],
    functionName: 'fetchTableCounts',
    caller: 'schemaSync',
    noLog: true,
  })
  const counts: Record<string, number> = {}
  for (const row of countResult.rows) counts[row.t] = parseInt(row.c, 10)
  return counts
}

/** Count rows for the given table names in a specific database identified by an env file. */
export async function fetchTableCountsForEnv(envFile: string, tables: string[]): Promise<Record<string, number>> {
  if (tables.length === 0) return {}
  const url = readEnvVar(envFile, 'POSTGRES_URL')
  if (!url) return {}
  const db = createArbitraryDb(url)
  const unions = tables.map(t => `SELECT '${t}'::text AS t, COUNT(*) AS c FROM public."${t}"`).join(' UNION ALL ')
  try {
    const result = await db.query({ query: unions })
    const counts: Record<string, number> = {}
    for (const row of result.rows) counts[row.t] = parseInt(row.c, 10)
    return counts
  } catch {
    return {}
  }
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

  // Second pass: also map sequences referenced in DEFAULT nextval() blocks (old-style serial columns)
  const defaultRe = /-- Name: (\w+) \w+; Type: DEFAULT;[\s\S]*?nextval\('public\.(\S+?)'::regclass\)/g
  let dm: RegExpExecArray | null
  while ((dm = defaultRe.exec(text)) !== null) {
    const tableName = dm[1]
    const seqName = dm[2]
    if (!seqToTable.has(seqName)) seqToTable.set(seqName, tableName)
  }

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

