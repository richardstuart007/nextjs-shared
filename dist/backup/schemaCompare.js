"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaSnapshot = schemaSnapshot;
exports.schemaCompare = schemaCompare;
//--------------------------------------------------------------------------
//  Ensure xsc_schema exists in the store database
//--------------------------------------------------------------------------
async function ensureTable(client) {
    await client.query(`
    CREATE TABLE IF NOT EXISTS xsc_schema (
      sc_id       SERIAL PRIMARY KEY,
      sc_source   TEXT NOT NULL,
      sc_table    TEXT NOT NULL,
      sc_column   TEXT NOT NULL,
      sc_datatype TEXT,
      sc_maxlen   INT,
      sc_nullable TEXT,
      sc_default  TEXT,
      sc_is_pk    BOOLEAN,
      sc_is_unique BOOLEAN,
      sc_has_index BOOLEAN
    )
  `);
}
//--------------------------------------------------------------------------
//  Query the public schema from a database
//--------------------------------------------------------------------------
async function fetchSchema(client) {
    const result = await client.query(`
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.is_nullable,
      c.column_default,
      EXISTS(
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
        WHERE tc.table_schema      = 'public'
          AND tc.constraint_type   = 'PRIMARY KEY'
          AND kcu.table_name       = c.table_name
          AND kcu.column_name      = c.column_name
      ) AS is_pk,
      EXISTS(
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
        WHERE tc.table_schema      = 'public'
          AND tc.constraint_type   = 'UNIQUE'
          AND kcu.table_name       = c.table_name
          AND kcu.column_name      = c.column_name
      ) AS is_unique,
      EXISTS(
        SELECT 1 FROM pg_indexes ix
        WHERE ix.schemaname = 'public'
          AND ix.tablename  = c.table_name
          AND ix.indexdef  LIKE '%' || c.column_name || '%'
      ) AS has_index
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  `);
    return result.rows.map(r => ({
        sc_table: r.table_name,
        sc_column: r.column_name,
        sc_datatype: r.data_type,
        sc_maxlen: r.character_maximum_length,
        sc_nullable: r.is_nullable,
        sc_default: r.column_default,
        sc_is_pk: r.is_pk,
        sc_is_unique: r.is_unique,
        sc_has_index: r.has_index
    }));
}
//--------------------------------------------------------------------------
//  Snapshot the public schema of sourceClient into storeClient's xsc_schema.
//  If storeClient is omitted it defaults to sourceClient (same-db case).
//  Any previous snapshot for this source is replaced.
//--------------------------------------------------------------------------
async function schemaSnapshot(sourceClient, source, storeClient = sourceClient) {
    await ensureTable(storeClient);
    await storeClient.query('DELETE FROM xsc_schema WHERE sc_source = $1', [source]);
    const rows = await fetchSchema(sourceClient);
    if (rows.length === 0)
        return;
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const values = [];
        const placeholders = batch.map((r, idx) => {
            const base = idx * 10;
            values.push(source, r.sc_table, r.sc_column, r.sc_datatype, r.sc_maxlen, r.sc_nullable, r.sc_default, r.sc_is_pk, r.sc_is_unique, r.sc_has_index);
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10})`;
        });
        await storeClient.query(`INSERT INTO xsc_schema
         (sc_source,sc_table,sc_column,sc_datatype,sc_maxlen,sc_nullable,sc_default,sc_is_pk,sc_is_unique,sc_has_index)
       VALUES ${placeholders.join(',')}`, values);
    }
}
//--------------------------------------------------------------------------
//  Compare two sources already stored in storeClient's xsc_schema.
//  Returns rows present in one source but not the other.
//--------------------------------------------------------------------------
const COMPARE_COLS = `sc_table,sc_column,sc_datatype,sc_maxlen,sc_nullable,sc_default,sc_is_pk,sc_is_unique,sc_has_index`;
async function schemaCompare(storeClient, source1, source2) {
    const only1 = await storeClient.query(`SELECT ${COMPARE_COLS} FROM xsc_schema WHERE sc_source = $1
     EXCEPT
     SELECT ${COMPARE_COLS} FROM xsc_schema WHERE sc_source = $2
     ORDER BY sc_table, sc_column`, [source1, source2]);
    const only2 = await storeClient.query(`SELECT ${COMPARE_COLS} FROM xsc_schema WHERE sc_source = $1
     EXCEPT
     SELECT ${COMPARE_COLS} FROM xsc_schema WHERE sc_source = $2
     ORDER BY sc_table, sc_column`, [source2, source1]);
    return [
        ...only1.rows.map(row => ({ direction: 'only_in_1', row })),
        ...only2.rows.map(row => ({ direction: 'only_in_2', row }))
    ];
}
