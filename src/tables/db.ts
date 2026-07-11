import { Client } from 'pg'
import { Pool } from '@neondatabase/serverless'
import { write_logging } from './tableGeneric/write_logging'
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
//-------------------------------------------------------------------------
export async function sql() {
  await createDbQueryHandler()
  return sqlHandler
}
//-------------------------------------------------------------------------
// Choose between Neon's Postgres handler and local Postgres handler
//-------------------------------------------------------------------------
async function createDbQueryHandler(): Promise<void> {
  //.........................................................................
  // Use Neon Postgres handler (production on Vercel)
  //.........................................................................
  if (process.env.NEXT_PUBLIC_APPENV_DBHANDLER === 'VERCEL_PG') {
    // Create a single pool for serverless environment
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 1 // Important for serverless
    })

    sqlHandler.query = async ({
      query,
      params = [],
      functionName = 'Neon_Unknown',
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
      //  Logging
      //
      if (!noLog) await log_query(functionName, query, params, caller, table, level, isupdate, severity)
      //
      //  Run query
      //
      try {
        const result = await pool.query(query, params)
        return result
      } catch (error) {
        const errorMessage = (error as Error).message
        if (functionName !== 'write_logging') {
          write_logging({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E',
            lg_table: table,
            lg_level: level,
            lg_isupdate: isupdate
          })
        }
        console.error('Error executing Neon query:', error)
        throw error
      }
    }
    //.........................................................................
    // Use local Postgres handler
    //.........................................................................
  } else {
    // Use local Postgres handler
    sqlHandler.query = async ({
      query,
      params = [],
      functionName = 'localhost_Unknown',
      caller = '',
      noLog = false,
      table = '',
      level = 1,
      isupdate = false,
      severity = 'I'
    }: QueryOptions) => {
      const client = new Client({
        connectionString: process.env.POSTGRES_URL
      })

      try {
        //
        // Remove redundant spaces
        //
        query = query.replace(/\s+/g, ' ').trim()
        //
        //  Logging
        //
        if (!noLog) await log_query(functionName, query, params, caller, table, level, isupdate, severity)
        //
        //  Run query
        //
        await client.connect()
        const result = await client.query(query, params)
        return result
      } catch (error) {
        const errorMessage = (error as Error).message
        if (functionName !== 'write_logging') {
          write_logging({
            lg_caller: caller,
            lg_functionname: functionName,
            lg_msg: errorMessage,
            lg_severity: 'E',
            lg_table: table,
            lg_level: level,
            lg_isupdate: isupdate
          })
        }
        console.error('Error:', errorMessage)
        throw error
      } finally {
        await client.end()
      }
    }
  }
}
//---------------------------------------------------------------------
//  logging
//---------------------------------------------------------------------
async function log_query(
  functionName: string,
  query: string,
  params: any[],
  caller: string,
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
  //  Values (if any)
  //
  const valuesJson = params?.length ? `, Values: ${JSON.stringify(params).replace(/"/g, "'")}` : ''
  //
  //  Logging
  //
  write_logging({
    lg_functionname: functionName,
    lg_msg: `DB_SQL | ${query}${valuesJson}`,
    lg_severity: severity,
    lg_caller: caller,
    lg_table: table,
    lg_level: level,
    lg_isupdate: isupdate
  })
}
