import { Pool } from '@neondatabase/serverless'
import { write_Logging } from './tableGeneric/write_logging'

//
// Single DB connection (works locally + prod)
//
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
})

//
// Query options
//
type QueryOptions = {
  query: string
  params?: any[]
  functionName?: string
  caller: string
}

let sqlHandler: { query: (options: QueryOptions) => Promise<any> } = {
  query: async () => Promise.resolve()
}

//-------------------------------------------------------------------------
// Public API
//-------------------------------------------------------------------------
export async function sql() {
  await createDbQueryHandler()
  return sqlHandler
}

//-------------------------------------------------------------------------
// Unified DB handler (NO branching)
//-------------------------------------------------------------------------
async function createDbQueryHandler(): Promise<void> {
  sqlHandler.query = async ({
    query,
    params = [],
    functionName = 'db_query',
    caller = ''
  }: QueryOptions) => {
    //
    // clean query
    //
    query = query.replace(/\s+/g, ' ').trim()

    //
    // logging
    //
    await log_query(functionName, query, params, caller)

    try {
      //
      // TRUE parameterised query (safe, fast, standard Postgres)
      //
      const result = await pool.query(query, params)
      return result
    } catch (error) {
      const errorMessage = (error as Error).message

      if (functionName !== 'write_Logging') {
        write_Logging({
          lg_caller: caller,
          lg_functionname: functionName,
          lg_msg: errorMessage,
          lg_severity: 'E'
        })
      }

      console.error('DB error:', error)
      throw error
    }
  }
}

//-------------------------------------------------------------------------
// logging
//-------------------------------------------------------------------------
async function log_query(
  functionName: string,
  query: string,
  params: any[],
  caller: string
): Promise<void> {
  if (functionName === 'write_Logging') return

  const valuesJson = params?.length ? `, Values: ${JSON.stringify(params).replace(/"/g, "'")}` : ''

  write_Logging({
    lg_functionname: functionName,
    lg_msg: `DB_SQL | ${query}${valuesJson}`,
    lg_severity: 'I',
    lg_caller: caller
  })
}
