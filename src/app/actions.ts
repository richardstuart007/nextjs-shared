'use server'

import { write_Logging } from '../tables/tableGeneric/write_logging'
import { table_fetch } from '../tables/tableGeneric/table_fetch'

//----------------------------------------------------------------------------------
//  action_generateLogs — writes test log entries across E / W / I severities,
//  including some with very long messages to test table truncation behaviour
//----------------------------------------------------------------------------------
export async function action_generateLogs(): Promise<string> {
  const caller = 'test-app'
  const entries: { severity: 'E' | 'W' | 'I'; fn: string; msg: string }[] = [
    {
      severity: 'E',
      fn: 'testFunction_E',
      msg: 'Short error message'
    },
    {
      severity: 'E',
      fn: 'testFunction_E',
      msg: 'Database connection failed while attempting to fetch user records from tus_users: ECONNREFUSED 127.0.0.1:5432 — the connection was refused, which usually means PostgreSQL is not running or is not accepting connections on that port. Check that the database server is started and that POSTGRES_URL is set correctly in your environment.'
    },
    {
      severity: 'E',
      fn: 'testFunction_E',
      msg: 'Unhandled exception in table_write: duplicate key value violates unique constraint "tus_users_pkey" — DETAIL: Key (tus_tusid)=(42) already exists. This occurred during a bulk import of 3,000 user records. The import has been aborted at row 847. All rows before this point were committed. Re-run the import starting from row 848 after resolving the duplicate key conflict.'
    },
    {
      severity: 'W',
      fn: 'testFunction_W',
      msg: 'Short warning message'
    },
    {
      severity: 'W',
      fn: 'testFunction_W',
      msg: 'Cache miss rate for table xlg_logging has exceeded 80% over the last 100 requests — consider increasing cache TTL or pre-warming the cache on application startup to reduce database load during peak traffic periods.'
    },
    {
      severity: 'W',
      fn: 'testFunction_W',
      msg: 'Response time for fetchFiltered on tplr_player exceeded 2000ms (actual: 3142ms). Query returned 12,450 rows with no LIMIT applied. This is likely caused by a missing index on tplr_name. Recommended action: CREATE INDEX CONCURRENTLY idx_tplr_name ON tplr_player(tplr_name) to bring query time under 100ms.'
    },
    {
      severity: 'I',
      fn: 'testFunction_I',
      msg: 'Short info message'
    },
    {
      severity: 'I',
      fn: 'testFunction_I',
      msg: 'User session started for richardstuart007@gmail.com from IP 192.168.1.23 using GitHub OAuth. Session token issued with 24-hour expiry. User has admin role.'
    },
    {
      severity: 'I',
      fn: 'testFunction_I',
      msg: 'Nightly schema snapshot completed successfully for database local_bridgeschool. Snapshot stored in xsc_schema with sc_snapid=1042. Total tables captured: 47. Total columns: 312. Comparison against previous snapshot sc_snapid=1041 shows 2 new columns added (tplr_rating_blitz, tplr_rating_rapid) and 0 columns removed. No destructive changes detected.'
    }
  ]
  for (const entry of entries) {
    await write_Logging({
      lg_caller: caller,
      lg_functionname: entry.fn,
      lg_msg: entry.msg,
      lg_severity: entry.severity
    })
  }
  return '9 log entries written'
}

//----------------------------------------------------------------------------------
//  action_generateCache — runs varied queries to create cache entries with
//  different SQL lengths, WHERE clauses, column lists and tables
//----------------------------------------------------------------------------------
export async function action_generateCache(): Promise<string> {
  const queries: Parameters<typeof table_fetch>[0][] = [
    {
      caller: 'test-app',
      table: 'xlg_logging',
      orderBy: 'lg_lgid DESC',
      limit: 5
    },
    {
      caller: 'test-app',
      table: 'xlg_logging',
      orderBy: 'lg_lgid DESC',
      limit: 25
    },
    {
      caller: 'test-app',
      table: 'xlg_logging',
      columns: ['lg_lgid', 'lg_severity', 'lg_caller', 'lg_functionname', 'lg_msg', 'lg_datetime'],
      orderBy: 'lg_datetime DESC',
      limit: 10
    },
    {
      caller: 'test-app-severity-filter',
      table: 'xlg_logging',
      whereColumnValuePairs: [{ column: 'lg_severity', value: 'E' }],
      orderBy: 'lg_lgid DESC',
      limit: 50
    },
    {
      caller: 'test-app-severity-filter',
      table: 'xlg_logging',
      whereColumnValuePairs: [{ column: 'lg_severity', value: 'W' }],
      orderBy: 'lg_lgid DESC',
      limit: 50
    },
    {
      caller: 'test-app-severity-filter',
      table: 'xlg_logging',
      whereColumnValuePairs: [{ column: 'lg_severity', value: 'I' }],
      orderBy: 'lg_lgid DESC',
      limit: 50
    },
    {
      caller: 'test-app-caller-filter',
      table: 'xlg_logging',
      whereColumnValuePairs: [{ column: 'lg_caller', value: 'test-app' }],
      columns: ['lg_lgid', 'lg_functionname', 'lg_msg', 'lg_severity'],
      orderBy: 'lg_lgid DESC',
      limit: 100
    },
    {
      caller: 'test-app-long-key',
      table: 'xlg_logging',
      columns: ['lg_lgid', 'lg_severity', 'lg_caller', 'lg_functionname', 'lg_msg', 'lg_datetime'],
      whereColumnValuePairs: [
        { column: 'lg_functionname', value: 'testFunction_E' },
        { column: 'lg_caller', value: 'test-app-severity-filter' },
        { column: 'lg_msg', value: 'Database connection failed while attempting to fetch user records from tus_users: ECONNREFUSED 127.0.0.1:5432' }
      ],
      orderBy: 'lg_lgid DESC',
      limit: 50
    },
    {
      caller: 'test-app-long-key',
      table: 'xlg_logging',
      columns: ['lg_lgid', 'lg_severity', 'lg_caller', 'lg_functionname', 'lg_msg', 'lg_datetime'],
      whereColumnValuePairs: [
        { column: 'lg_severity', value: 'W' },
        { column: 'lg_functionname', value: 'testFunction_W' },
        { column: 'lg_msg', value: 'Cache miss rate for table xlg_logging has exceeded 80% over the last 100 requests — consider increasing cache TTL or pre-warming the cache on application startup to reduce database load during peak traffic periods.' }
      ],
      orderBy: 'lg_datetime DESC',
      limit: 25
    },
    {
      caller: 'test-app-long-key',
      table: 'xlg_logging',
      columns: ['lg_lgid', 'lg_severity', 'lg_caller', 'lg_functionname', 'lg_msg', 'lg_datetime'],
      whereColumnValuePairs: [
        { column: 'lg_severity', value: 'I' },
        { column: 'lg_caller', value: 'test-app' },
        { column: 'lg_functionname', value: 'testFunction_I' },
        { column: 'lg_msg', value: 'Nightly schema snapshot completed successfully for database local_bridgeschool. Snapshot stored in xsc_schema with sc_snapid=1042. Total tables captured: 47. Total columns: 312.' }
      ],
      orderBy: 'lg_lgid DESC',
      limit: 10
    }
  ]
  for (const query of queries) {
    await table_fetch(query)
  }
  return `${queries.length} cache entries created`
}
