'use server'

import { createClient, read_location } from './dbClient'
import { fetchSchema, diffSchemas, generateAlterSQL, type SchemaCompareResult } from './schemaUtils'

export type { SchemaCompareResult, DiffRow, ChangeRow, TableSummary, TableStatus } from './schemaUtils'

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
