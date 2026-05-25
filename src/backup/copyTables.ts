'use server'

import { execSync, spawnSync, ExecSyncOptions } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { write_Logging } from '../tables/tableGeneric/write_logging'
import { readEnvVar } from './dbClient'

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

function spawnPg(args: string[]): { stdout: string; stderr: string } {
  const augmentedPath = [...PG_BIN_PATHS, process.env.PATH ?? ''].join(';')
  const result = spawnSync('psql', args, {
    encoding: 'utf8',
    env: { ...process.env, PATH: augmentedPath }
  })
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
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
export async function read_url(envFile: string): Promise<string> {
  return readEnvVar(envFile, 'POSTGRES_URL')
}

export async function read_location(envFile: string): Promise<string> {
  return readEnvVar(envFile, 'POSTGRES_DATABASE_LOCATION')
}
//--------------------------------------------------------------------------
//  List .env.* files in a directory with their POSTGRES_DATABASE_LOCATION
//--------------------------------------------------------------------------
export type EnvFile = { file: string; location: string }

export async function list_env_files(dir: string): Promise<EnvFile[]> {
  try {
    const entries = readdirSync(dir)
    return entries
      .filter(f => /^\.env\./.test(f))
      .sort()
      .map(file => ({
        file,
        location: readEnvVar(join(dir, file), 'POSTGRES_DATABASE_LOCATION')
      }))
  } catch {
    return []
  }
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
//  Processes one table at a time so every log entry includes the table name
//--------------------------------------------------------------------------
export async function copy_tables({
  sourceUrl,
  targetUrl,
  tables,
  sourceLabel = '',
  targetLabel = '',
  caller = ''
}: {
  sourceUrl: string
  targetUrl: string
  tables: string[]
  sourceLabel?: string
  targetLabel?: string
  caller?: string
}): Promise<CopyResult> {
  const functionName = 'copy_tables'
  const allLogs: CopyLog[] = []
  let hasError = false

  const cleanSource = stripUnsupportedParams(sourceUrl)
  const cleanTarget = stripUnsupportedParams(targetUrl)
  const envTag = sourceLabel && targetLabel ? ` [${sourceLabel} → ${targetLabel}]` : ''

  for (const table of tables) {
    const tableLogs: CopyLog[] = []
    const tmpFile = join(tmpdir(), `copy_${table}_${Date.now()}.sql`)

    try {
      // Step 1: dump single table
      try {
        execPg(`pg_dump --no-owner --clean --if-exists -t ${table} "${cleanSource}" -f "${tmpFile}"`)
      } catch (error) {
        const msg = (error as Error).message
        const log: CopyLog = { event: 'ERROR', detail: `${table} — pg_dump failed: ${msg}` }
        tableLogs.push(log)
        allLogs.push(log)
        hasError = true
        write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: `${table}: pg_dump failed: ${msg}`, lg_severity: 'E' })
        continue
      }

      // Step 2: filter lines the target doesn't support; strip setval
      // (sequences are repaired in step 4 based on MAX(id))
      const filtered = readFileSync(tmpFile, 'utf8')
        .split('\n')
        .filter(line => !line.match(/transaction_timeout/))
        .filter(line => !line.match(/setval/))
        .join('\n')
      writeFileSync(tmpFile, filtered, 'utf8')

      // Step 3: restore to target, capture output
      let psqlOutput = ''
      try {
        psqlOutput = execPg(`psql "${cleanTarget}" -f "${tmpFile}"`, { encoding: 'utf8' }) as string
      } catch (error) {
        psqlOutput = (error as any).stdout ?? ''
        const stderr = ((error as any).stderr ?? '').trim()
        if (stderr) {
          write_Logging({ lg_caller: caller, lg_functionname: functionName, lg_msg: `${table}: ${stderr}`, lg_severity: 'E' })
        }
      }

      for (const log of parsePsqlOutput(psqlOutput)) {
        const tagged: CopyLog = { event: log.event, detail: `${table} — ${log.detail}` }
        tableLogs.push(tagged)
        allLogs.push(tagged)
        if (log.event === 'ERROR') hasError = true
      }

      // Step 4: repair sequence — set to MAX(pk) so inserts don't collide
      const seqFile = join(tmpdir(), `seq_${table}_${Date.now()}.sql`)
      try {
        const seqSql = `DO $$
DECLARE
  r RECORD;
  v BIGINT;
BEGIN
  FOR r IN
    SELECT t.relname, a.attname,
           pg_get_serial_sequence('public.'||t.relname, a.attname) AS seq
    FROM pg_class t
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum > 0
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = '${table}'
      AND pg_get_serial_sequence('public.'||t.relname, a.attname) IS NOT NULL
  LOOP
    EXECUTE format('SELECT COALESCE(MAX(%I),0) FROM %I', r.attname, r.relname) INTO v;
    PERFORM setval(r.seq, GREATEST(v, 1), v > 0);
    RAISE NOTICE 'SEQFIX:%:%', r.relname, v;
  END LOOP;
END $$;
`
        writeFileSync(seqFile, seqSql, 'utf8')
        const { stderr } = spawnPg([cleanTarget, '-f', seqFile])
        for (const line of stderr.split('\n')) {
          const match = line.match(/SEQFIX:([^:]+):(\d+)/)
          if (match) {
            const seqLog: CopyLog = { event: 'SEQUENCE', detail: `${match[1]} — repaired to ${match[2]}` }
            tableLogs.push(seqLog)
            allLogs.push(seqLog)
          }
        }
      } catch {
        // sequence repair is best-effort — don't fail the whole operation
      } finally {
        if (existsSync(seqFile)) unlinkSync(seqFile)
      }

      // One write_Logging entry per event — matches the UI log exactly
      for (const log of tableLogs) {
        const msg = log.detail.replace(`${table} — `, `${table}${envTag} — `)
        write_Logging({
          lg_caller: caller,
          lg_functionname: functionName,
          lg_msg: msg,
          lg_severity: log.event === 'ERROR' ? 'E' : 'I'
        })
      }

    } finally {
      if (existsSync(tmpFile)) unlinkSync(tmpFile)
    }
  }

  return { success: !hasError, logs: allLogs }
}
