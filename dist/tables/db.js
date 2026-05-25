"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = sql;
const pg_1 = require("pg");
const serverless_1 = require("@neondatabase/serverless");
const write_logging_1 = require("./tableGeneric/write_logging");
let sqlHandler = {
    query: async () => Promise.resolve()
};
//-------------------------------------------------------------------------
// Export an async function named sql to initialize and return the sql handler
//-------------------------------------------------------------------------
async function sql() {
    await createDbQueryHandler();
    return sqlHandler;
}
//-------------------------------------------------------------------------
// Choose between Neon's Postgres handler and local Postgres handler
//-------------------------------------------------------------------------
async function createDbQueryHandler() {
    //.........................................................................
    // Use Neon Postgres handler (production on Vercel)
    //.........................................................................
    if (process.env.NEXT_PUBLIC_APPENV_DBHANDLER === 'VERCEL_PG') {
        // Create a single pool for serverless environment
        const pool = new serverless_1.Pool({
            connectionString: process.env.POSTGRES_URL,
            max: 1 // Important for serverless
        });
        sqlHandler.query = async ({ query, params = [], functionName = 'Neon_Unknown', caller = '', noLog = false }) => {
            //
            // Remove redundant spaces
            //
            query = query.replace(/\s+/g, ' ').trim();
            //
            //  Logging
            //
            if (!noLog)
                await log_query(functionName, query, params, caller);
            //
            //  Run query
            //
            try {
                const result = await pool.query(query, params);
                return result;
            }
            catch (error) {
                const errorMessage = error.message;
                if (functionName !== 'write_Logging') {
                    (0, write_logging_1.write_Logging)({
                        lg_caller: caller,
                        lg_functionname: functionName,
                        lg_msg: errorMessage,
                        lg_severity: 'E'
                    });
                }
                console.error('Error executing Neon query:', error);
                throw error;
            }
        };
        //.........................................................................
        // Use local Postgres handler
        //.........................................................................
    }
    else {
        // Use local Postgres handler
        sqlHandler.query = async ({ query, params = [], functionName = 'localhost_Unknown', caller = '', noLog = false }) => {
            const client = new pg_1.Client({
                connectionString: process.env.POSTGRES_URL
            });
            try {
                //
                // Remove redundant spaces
                //
                query = query.replace(/\s+/g, ' ').trim();
                //
                //  Logging
                //
                if (!noLog)
                    await log_query(functionName, query, params, caller);
                //
                //  Run query
                //
                await client.connect();
                const result = await client.query(query, params);
                return result;
            }
            catch (error) {
                const errorMessage = error.message;
                if (functionName !== 'write_Logging') {
                    (0, write_logging_1.write_Logging)({
                        lg_caller: caller,
                        lg_functionname: functionName,
                        lg_msg: errorMessage,
                        lg_severity: 'E'
                    });
                }
                console.error('Error:', errorMessage);
                throw error;
            }
            finally {
                await client.end();
            }
        };
    }
}
//---------------------------------------------------------------------
//  logging
//---------------------------------------------------------------------
async function log_query(functionName, query, params, caller) {
    //
    //  Do not recursive for logging
    //
    if (functionName === 'write_Logging')
        return;
    //
    //  Values (if any)
    //
    const valuesJson = params?.length ? `, Values: ${JSON.stringify(params).replace(/"/g, "'")}` : '';
    //
    //  Logging
    //
    (0, write_logging_1.write_Logging)({
        lg_functionname: functionName,
        lg_msg: `DB_SQL | ${query}${valuesJson}`,
        lg_severity: 'I',
        lg_caller: caller
    });
}
