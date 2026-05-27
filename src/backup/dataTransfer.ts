'use server'

import { readEnvVar } from './dbClient'
import { createArbitraryDb, runBatch } from '../tables/dbArbitrary'
import { fetchSchema, generateCreateTableDDL } from './schemaUtils'
import type { SchemaRow } from './schemaUtils'

export type FetchResult = {
  columns: string[]
  rows: any[][]
  rowCount: number
}

export type TransferApplyResult = {
  ok: number
  errors: Array<{ row: number; error: string }>
}

/** Run a SELECT query against the given env file's database; returns column names and rows as arrays. */
export async function fetchRows(envFile: string, selectSql: string): Promise<FetchResult> {
  const url = readEnvVar(envFile, 'POSTGRES_URL')
  if (!url) throw new Error(`POSTGRES_URL not found in ${envFile}`)
  const db = createArbitraryDb(url)
  const result = await db.query({ query: selectSql })
  const columns = result.fields.map(f => f.name)
  const rows = result.rows.map(r => columns.map(c => r[c]))
  return { columns, rows, rowCount: rows.length }
}

export type SnapshotResult = {
  snapshotName: string
  rowCount: number
}

/** Create a snapshot table in the target database populated from a SELECT on the source.
 *  Table name is <source_location>_<tableName>. Schema is mirrored from the source table; no indexes or constraints. */
export async function createSnapshotTable(
  sourceEnvFile: string,
  targetEnvFile: string,
  tableName: string,
  selectSql: string
): Promise<SnapshotResult> {
  const sourceUrl = readEnvVar(sourceEnvFile, 'POSTGRES_URL')
  const targetUrl = readEnvVar(targetEnvFile, 'POSTGRES_URL')
  if (!sourceUrl) throw new Error(`POSTGRES_URL not found in ${sourceEnvFile}`)
  if (!targetUrl) throw new Error(`POSTGRES_URL not found in ${targetEnvFile}`)

  const rawPrefix = readEnvVar(sourceEnvFile, 'POSTGRES_DATABASE_LOCATION') || 'snap'
  const prefix = rawPrefix.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const snapshotName = `${prefix}_${tableName}`

  const sourceDb = createArbitraryDb(sourceUrl)

  // Fetch data and schema in parallel
  const [dataResult, allSchema] = await Promise.all([
    sourceDb.query({ query: selectSql }),
    fetchSchema(sourceDb),
  ])

  const selectColumns = dataResult.fields.map(f => f.name)
  const rows = dataResult.rows.map((r: Record<string, any>) => selectColumns.map(c => r[c]))

  // Match SELECT columns to source schema; unknown columns (computed, aliased) fall back to TEXT
  const schemaMap = new Map(allSchema.filter(r => r.table_name === tableName).map(r => [r.column_name, r]))
  const columns: SchemaRow[] = selectColumns.map(colName => schemaMap.get(colName) ?? {
    table_name: tableName,
    column_name: colName,
    data_type: 'text',
    max_len: null,
    is_nullable: 'YES',
    column_default: null,
    is_pk: false,
    is_unique: false,
    has_index: false,
  })

  const createDDL = generateCreateTableDDL(columns, snapshotName)

  const queries: Array<{ query: string; params?: any[] }> = [
    { query: `DROP TABLE IF EXISTS "${snapshotName}"` },
    { query: createDDL },
  ]

  if (rows.length > 0) {
    const colList = selectColumns.map(c => `"${c}"`).join(', ')
    const placeholders = selectColumns.map((_, i) => `$${i + 1}`).join(', ')
    const insertSql = `INSERT INTO "${snapshotName}" (${colList}) VALUES (${placeholders})`
    for (const row of rows) {
      queries.push({ query: insertSql, params: row })
    }
  }

  await runBatch(targetUrl, queries)
  return { snapshotName, rowCount: rows.length }
}

/** Execute an INSERT/UPDATE SQL template once per row; $1..$N map to columns in the order returned by fetchRows. */
export async function applyRows(
  envFile: string,
  insertSql: string,
  rows: any[][]
): Promise<TransferApplyResult> {
  const url = readEnvVar(envFile, 'POSTGRES_URL')
  if (!url) throw new Error(`POSTGRES_URL not found in ${envFile}`)
  const db = createArbitraryDb(url)
  let ok = 0
  const errors: Array<{ row: number; error: string }> = []
  for (let i = 0; i < rows.length; i++) {
    try {
      await db.query({ query: insertSql, params: rows[i] })
      ok++
    } catch (error) {
      errors.push({ row: i + 1, error: (error as Error).message })
    }
  }
  return { ok, errors }
}
