import { Client } from 'pg'
import { Pool } from '@neondatabase/serverless'
import { write_logging } from './tableGeneric/write_logging'
import { buildSql_Readable } from './tableGeneric/buildSql_Readable'
import { POSTGRES_URL_PREFIX } from '../constants'
//
// Placeholder for the `query` method
//
type QueryOptions = {
  query: string
  params?: any[]
  functionName?: string
  caller: string
  noLog?: boolean
  table?: string
  level?: number
  isupdate?: boolean
  severity?: string
}
let sqlHandler: { query: (options: QueryOptions) => Promise<any> } = {
  query: async () => Promise.resolve()
}
//-------------------------------------------------------------------------
// Export an async function named sql to initialize and return the sql handler
//
//  Returns:
//    the shared query handler ({ query }), lazily initializing it on first call
//-------------------------------------------------------------------------
export async function sql() {
  createDbQueryHandler()
  return sqlHandler
}
//-------------------------------------------------------------------------
//  The routing table itself always lives on the primary database — a query has to know where
//  to look up routing before it can route anything, so this lookup can never itself be routed.
//  The "no routing row configured" sentinel is POSTGRES_URL_PREFIX itself (not a separate made-up
//  label) so every dbKey — routed or not — is always the real env var name, everywhere it's used
//  or logged.
//-------------------------------------------------------------------------
// Build the single, unified query entrypoint once per warm instance. Which physical database a
// given call actually reaches is decided per-call inside sqlHandler.query, via resolveDbKey —
// not here.
//-------------------------------------------------------------------------
let handlerInitialized = false

//-------------------------------------------------------------------------
//  createDbQueryHandler — installs sqlHandler.query (once per warm instance):
//  strips redundant whitespace, resolves the target dbKey, logs the query trace
//  (unless noLog), runs it against that database, and logs any failure
//-------------------------------------------------------------------------
function createDbQueryHandler(): void {
  if (handlerInitialized) return
  handlerInitialized = true

  sqlHandler.query = async ({
    query,
    params = [],
    functionName = 'Unknown',
    caller = '',
    noLog = false,
    table = '',
    level = 1,
    isupdate = false,
    severity = 'I'
  }: QueryOptions) => {
    //
    // Remove redundant spaces
    //
    query = query.replace(/\s+/g, ' ').trim()
    //
    //  Resolve which database this table is routed to before logging, so both the trace log
    //  and any failure log below already know it
    //
    const dbKey = await resolveDbKey(table)
    //
    //  Logging
    //
    if (!noLog) await log_query(functionName, query, params, caller, dbKey, table, level, isupdate, severity)
    //
    //  Run query against the resolved database
    //
    try {
      const rawHandler = await getRawHandler(dbKey)
      const result = await rawHandler.query(query, params)
      return result
    } catch (error) {
      const errorMessage = (error as Error).message
      if (functionName !== 'write_logging') {
        write_logging({
          lg_caller: caller,
          lg_functionname: functionName,
          lg_dbkey: dbKey,
          lg_msg: errorMessage,
          lg_severity: 'E',
          lg_table: table,
          lg_level: level,
          lg_isupdate: isupdate,
          lg_sql_raw: query,
          lg_sql_params: params,
          lg_sql_readable: buildSql_Readable(query, params)
        })
      }
      console.error(`[db.ts] Query failed (table=${table || 'n/a'}, dbKey=${dbKey || 'n/a'}): ${errorMessage}`)
      throw error
    }
  }
}
//-------------------------------------------------------------------------
//  Raw per-database connection, keyed by dbKey — dbKey is always the literal env var name to
//  read (e.g. dbKey 'POSTGRES_URL1' -> process.env.POSTGRES_URL1; dbKey POSTGRES_URL_PREFIX
//  itself -> process.env.POSTGRES_URL). Lazily created and cached per dbKey, same lifecycle the
//  original single-connection code used for the primary database.
//-------------------------------------------------------------------------
type RawHandler = { query: (query: string, params: any[]) => Promise<any> }
const rawHandlers = new Map<string, RawHandler>()

//-------------------------------------------------------------------------
//  getRawHandler — the raw query function for one database, cached per dbKey.
//  Uses Neon's serverless Pool when NEXT_PUBLIC_APPENV_DBHANDLER='VERCEL_PG',
//  otherwise a plain pg Client connect/query/end per call.
//
//  Params:
//    dbKey — env var name to read the connection string from
//
//  Returns:
//    a { query } handler for that database
//-------------------------------------------------------------------------
async function getRawHandler(dbKey: string): Promise<RawHandler> {
  const cached = rawHandlers.get(dbKey)
  if (cached) return cached

  const connectionString = process.env[dbKey]

  let rawHandler: RawHandler
  //.........................................................................
  // Use Neon Postgres handler (production on Vercel)
  //.........................................................................
  if (process.env.NEXT_PUBLIC_APPENV_DBHANDLER === 'VERCEL_PG') {
    // Create a single pool per dbKey for serverless environment
    const pool = new Pool({
      connectionString,
      max: 1 // Important for serverless
    })
    rawHandler = {
      query: (query, params) => pool.query(query, params)
    }
    //.........................................................................
    // Use local Postgres handler
    //.........................................................................
  } else {
    rawHandler = {
      query: async (query, params) => {
        const client = new Client({ connectionString })
        try {
          await client.connect()
          const result = await client.query(query, params)
          return result
        } finally {
          await client.end()
        }
      }
    }
  }
  rawHandlers.set(dbKey, rawHandler)
  return rawHandler
}
//-------------------------------------------------------------------------
//  Table -> dbKey routing map, loaded once from xrtg_routing (on primary) per warm instance,
//  then cached in memory for that instance's whole lifetime — a routing row added or changed
//  while the server is already running has no effect until the next restart/cold start.
//  Any failure (most commonly: xrtg_routing doesn't exist yet in this project) falls back to an
//  empty map, so every table resolves to primary — non-breaking by design, no project is forced
//  to opt into multi-database routing.
//-------------------------------------------------------------------------
let routingMapPromise: Promise<Record<string, string>> | null = null

//-------------------------------------------------------------------------
//  getRoutingMap — the cached routing map, loading it on first call
//
//  Returns:
//    the table -> dbKey map
//-------------------------------------------------------------------------
async function getRoutingMap(): Promise<Record<string, string>> {
  if (!routingMapPromise) routingMapPromise = loadRoutingMap()
  return routingMapPromise
}

//-------------------------------------------------------------------------
//  loadRoutingMap — reads every xrtg_routing row from the primary database
//
//  Returns:
//    the table -> dbKey map, or {} if xrtg_routing doesn't exist yet/query fails
//-------------------------------------------------------------------------
async function loadRoutingMap(): Promise<Record<string, string>> {
  try {
    const primaryHandler = await getRawHandler(POSTGRES_URL_PREFIX)
    const result = await primaryHandler.query('SELECT rtg_table, rtg_dbkey FROM xrtg_routing', [])
    const map: Record<string, string> = {}
    for (const row of result.rows as { rtg_table: string; rtg_dbkey: string }[]) {
      map[row.rtg_table] = row.rtg_dbkey
    }
    console.log('[db.ts] xrtg_routing loaded — routing map:', map)
    return map
  } catch {
    return {}
  }
}

//-------------------------------------------------------------------------
//  resolveDbKey — the dbKey a table is routed to
//
//  Params:
//    table — table name to look up; '' (no table) always resolves to primary
//
//  Returns:
//    the routed dbKey, or POSTGRES_URL_PREFIX (primary) if no routing row exists
//-------------------------------------------------------------------------
export async function resolveDbKey(table: string): Promise<string> {
  if (!table) return POSTGRES_URL_PREFIX
  const map = await getRoutingMap()
  return map[table] ?? POSTGRES_URL_PREFIX
}
//---------------------------------------------------------------------
//  log_query — writes the query-level trace log entry for one query (skipped for
//  write_logging itself, to avoid infinite recursion)
//
//  Params:
//    functionName    — the calling function's name (used as lg_functionname)
//    query, params    — the SQL and its bound values
//    caller           — logging caller identity
//    dbKey            — the resolved database this query ran against
//    table            — table name, if any
//    level, severity  — logging level/severity
//    isupdate         — whether this query is a write
//---------------------------------------------------------------------
async function log_query(
  functionName: string,
  query: string,
  params: any[],
  caller: string,
  dbKey: string,
  table: string,
  level: number,
  isupdate: boolean,
  severity: string
): Promise<void> {
  //
  //  Do not recursive for logging
  //
  if (functionName === 'write_logging') return
  //
  //  Logging — query/params/readable now live in their own columns, not embedded in lg_msg
  //
  write_logging({
    lg_functionname: functionName,
    lg_msg: 'DB_SQL',
    lg_severity: severity,
    lg_caller: caller,
    lg_dbkey: dbKey,
    lg_table: table,
    lg_level: level,
    lg_isupdate: isupdate,
    lg_sql_raw: query,
    lg_sql_params: params,
    lg_sql_readable: buildSql_Readable(query, params)
  })
}
