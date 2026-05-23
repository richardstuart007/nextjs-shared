'use server'

import { execSync, ExecSyncOptions } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { write_Logging } from '../tables/tableGeneric/write_logging'

const PG_BIN_PATHS = [
  'C:\\Program Files\\PostgreSQL\\18\\bin',
  'C:\\Program Files\\PostgreSQL\\17\\bin',
  'C:\\Program Files\\PostgreSQL\\16\\bin',
  'C:\\Program Files\\PostgreSQL\\15\\bin',
]

function execPg(cmd: string, options: ExecSyncOptions = {}) {
  const augmentedPath = [...PG_BIN_PATHS, process.env.PATH ?? ''].join(';')
  return execSync(cmd, { ...options, env: { ...process.env, PATH: augmentedPath } })
}
//--------------------------------------------------------------------------
//  Types
//--------------------------------------------------------------------------
export type CopyEvent = 'DROP' | 'CREATE_TABLE' | 'COPY' | 'INDEX' | 'SEQUENCE' | 'ERROR'

export type CopyLog = {
  event: CopyEvent
  detail: string
}

export type CopyResult = {
  success: boolean
  logs: CopyLog[]
}
//--------------------------------------------------------------------------
//  Read POSTGRES_URL from a .env file on disk
//--------------------------------------------------------------------------
export async function read_url(envFile: string): Promise<string> {
  const content = readFileSync(envFile, 'utf8')
  const match = content.match(/^POSTGRES_URL=(.+)$/m)
  return match ? match[1].trim() : ''
}
//--------------------------------------------------------------------------
//  Strip query parameters unsupported by psql / pg_dump (e.g. timezone)
//--------------------------------------------------------------------------
function stripUnsupportedParams(url: string): string {
  return url.replace(/[&?]timezone=[^&]*/g, '')
}
//--------------------------------------------------------------------------
//  Parse psql stdout into structured log entries
//--------------------------------------------------------------------------
function parsePsqlOutput(output: string): CopyLog[] {
  const logs: CopyLog[] = []
  const lines = output.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (/^DROP TABLE/i.test(trimmed)) {
      logs.push({ event: 'DROP', detail: trimmed })
    } else if (/^CREATE TABLE/i.test(trimmed)) {
      logs.push({ event: 'CREATE_TABLE', detail: trimmed })
    } else if (/^COPY (\d+)/.test(trimmed)) {
      const match = trimmed.match(/^COPY (\d+)/)!
      logs.push({ event: 'COPY', detail: `${match[1]} rows copied` })
    } else if (/^CREATE INDEX/i.test(trimmed)) {
      logs.push({ event: 'INDEX', detail: trimmed })
    } else if (/^\s*setval\s*$/.test(line)) {
      // psql renders setval as a table: header / dashes / value / (1 row)
      if (i + 2 < lines.length) {
        const valueLine = lines[i + 2].trim()
        if (/^\d+$/.test(valueLine)) {
          logs.push({ event: 'SEQUENCE', detail: `sequence reset to ${valueLine}` })
          i += 3
          continue
        }
      }
    } else if (/ERROR/i.test(trimmed) && trimmed.length > 5) {
      logs.push({ event: 'ERROR', detail: trimmed })
    }
    i++
  }

  return logs
}
//--------------------------------------------------------------------------
//  Get list of user tables from a Postgres database
//--------------------------------------------------------------------------
export async function get_tables({
  url,
  caller = ''
}: {
  url: string
  caller?: string
}): Promise<string[]> {
  const functionName = 'get_tables'
  try {
    const cleanUrl = stripUnsupportedParams(url)
    const output = execPg(
      `psql "${cleanUrl}" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"`,
      { encoding: 'utf8' }
    ) as string
    return output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('('))
  } catch (error) {
    const msg = (error as Error).message
    write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' })
    return []
  }
}
//--------------------------------------------------------------------------
//  Copy a selection of tables from one Postgres database to another
//--------------------------------------------------------------------------
export async function copy_tables({
  sourceUrl,
  targetUrl,
  tables,
  caller = ''
}: {
  sourceUrl: string
  targetUrl: string
  tables: string[]
  caller?: string
}): Promise<CopyResult> {
  const functionName = 'copy_tables'
  const tmpFile = join(tmpdir(), `copy_tables_${Date.now()}.sql`)

  try {
    const cleanSource = stripUnsupportedParams(sourceUrl)
    const cleanTarget = stripUnsupportedParams(targetUrl)
    const tableFlags = tables.map(t => `-t ${t}`).join(' ')

    // Step 1: dump source tables to temp file
    try {
      execPg(`pg_dump --no-owner --clean ${tableFlags} "${cleanSource}" -f "${tmpFile}"`)
    } catch (error) {
      const msg = (error as Error).message
      write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' })
      return { success: false, logs: [{ event: 'ERROR', detail: `pg_dump failed: ${msg}` }] }
    }

    // Step 2: remove parameters the target may not support
    const filtered = readFileSync(tmpFile, 'utf8')
      .split('\n')
      .filter(line => !line.match(/transaction_timeout/))
      .join('\n')
    writeFileSync(tmpFile, filtered, 'utf8')

    // Step 3: restore to target, capture output for logging
    let psqlOutput = ''
    try {
      psqlOutput = execPg(`psql "${cleanTarget}" -f "${tmpFile}"`, { encoding: 'utf8' }) as string
    } catch (error) {
      psqlOutput = (error as any).stdout ?? ''
      const stderr = ((error as any).stderr ?? '').trim()
      if (stderr) {
        write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: stderr, lg_severity: 'E' })
      }
    }

    const logs = parsePsqlOutput(psqlOutput)
    return { success: !logs.some(l => l.event === 'ERROR'), logs }

  } catch (error) {
    const msg = (error as Error).message
    write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: msg, lg_severity: 'E' })
    return { success: false, logs: [{ event: 'ERROR', detail: msg }] }
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile)
  }
}
