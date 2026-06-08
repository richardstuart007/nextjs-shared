"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSchema = fetchSchema;
exports.diffSchemas = diffSchemas;
exports.generateAlterSQL = generateAlterSQL;
/** Query all columns in the public schema with PK, unique, and index flags. */
async function fetchSchema(db) {
    const result = await db.query({ query: `
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.character_maximum_length AS max_len,
      c.is_nullable,
      c.column_default,
      EXISTS(
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
        WHERE tc.table_schema    = 'public'
          AND tc.constraint_type = 'PRIMARY KEY'
          AND kcu.table_name     = c.table_name
          AND kcu.column_name    = c.column_name
      ) AS is_pk,
      EXISTS(
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
        WHERE tc.table_schema    = 'public'
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.table_name     = c.table_name
          AND kcu.column_name    = c.column_name
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
  ` });
    return result.rows;
}
function normalizeDefault(d) {
    if (!d)
        return d;
    return d.replace(/nextval\('public\.([^']+)'(::regclass)?\)/g, "nextval('$1'$2)");
}
/** Compare two SchemaRow arrays and return columns only in each side, changed columns, and a per-table status summary. */
function diffSchemas(rows1, rows2, label1, label2) {
    const key = (r) => `${r.table_name}::${r.column_name}`;
    const map1 = new Map(rows1.map(r => [key(r), r]));
    const map2 = new Map(rows2.map(r => [key(r), r]));
    const onlyIn1 = rows1
        .filter(r => !map2.has(key(r)))
        .map(r => ({ ...r, side: label1 }));
    const onlyIn2 = rows2
        .filter(r => !map1.has(key(r)))
        .map(r => ({ ...r, side: label2 }));
    const changed = [];
    for (const [k, src] of map1) {
        const tgt = map2.get(k);
        if (!tgt)
            continue;
        if (src.data_type !== tgt.data_type ||
            src.max_len !== tgt.max_len ||
            src.is_nullable !== tgt.is_nullable ||
            normalizeDefault(src.column_default) !== normalizeDefault(tgt.column_default)) {
            changed.push({ table_name: src.table_name, column_name: src.column_name, source: src, target: tgt });
        }
    }
    // Build per-table summary across all tables seen in either DB
    const tables1 = [...new Set(rows1.map(r => r.table_name))].sort();
    const tables2 = new Set(rows2.map(r => r.table_name));
    const diffTables = new Set([
        ...onlyIn1.map(r => r.table_name),
        ...onlyIn2.map(r => r.table_name),
        ...changed.map(r => r.table_name),
    ]);
    const allTables = [...new Set([...tables1, ...rows2.map(r => r.table_name)])].sort();
    const tableSummary = allTables.map(t => {
        const inSource = tables1.includes(t);
        const inTarget = tables2.has(t);
        let status;
        if (inSource && inTarget) {
            status = diffTables.has(t) ? 'different' : 'identical';
        }
        else {
            status = inSource ? 'only_in_source' : 'only_in_target';
        }
        return { table_name: t, status };
    });
    return { onlyIn1, onlyIn2, changed, tableSummary };
}
function buildTypeStr(col) {
    if ((col.data_type === 'character varying' || col.data_type === 'character') && col.max_len) {
        return col.data_type === 'character varying' ? `VARCHAR(${col.max_len})` : `CHAR(${col.max_len})`;
    }
    return col.data_type.toUpperCase();
}
/** Generate ALTER TABLE / CREATE TABLE SQL to bring the target in line with the source; identity-column defaults are skipped with a comment. */
function generateAlterSQL(result) {
    const sqls = [];
    // Tables entirely missing from target need CREATE TABLE, not ADD COLUMN
    const missingTables = new Set(result.tableSummary.filter(t => t.status === 'only_in_source').map(t => t.table_name));
    const byTable = new Map();
    for (const col of result.onlyIn1) {
        ;
        (byTable.get(col.table_name) ?? byTable.set(col.table_name, []).get(col.table_name)).push(col);
    }
    for (const [tableName, cols] of byTable) {
        if (missingTables.has(tableName)) {
            sqls.push(`-- CREATE TABLE "${tableName}" — use the Create SQL tab for full DDL including indexes and constraints`);
        }
        else {
            for (const col of cols) {
                const typeStr = buildTypeStr(col);
                const nullStr = col.is_nullable === 'NO' ? ' NOT NULL' : '';
                const defStr = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                sqls.push(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col.column_name}" ${typeStr}${nullStr}${defStr};`);
            }
        }
    }
    for (const c of result.changed) {
        if (c.source.data_type !== c.target.data_type || c.source.max_len !== c.target.max_len) {
            const typeStr = buildTypeStr(c.source);
            sqls.push(`ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" TYPE ${typeStr} USING "${c.column_name}"::text::${typeStr};`);
        }
        if (c.source.is_nullable !== c.target.is_nullable) {
            sqls.push(c.source.is_nullable === 'NO'
                ? `ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" SET NOT NULL;`
                : `ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" DROP NOT NULL;`);
        }
        if (c.source.column_default !== c.target.column_default) {
            if (c.source.column_default?.startsWith('nextval(') && !c.target.column_default) {
                sqls.push(`-- Skipped: "${c.table_name}"."${c.column_name}" — target may be an IDENTITY column (cannot SET DEFAULT on identity)`);
            }
            else {
                sqls.push(c.source.column_default
                    ? `ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" SET DEFAULT ${c.source.column_default};`
                    : `ALTER TABLE "${c.table_name}" ALTER COLUMN "${c.column_name}" DROP DEFAULT;`);
            }
        }
    }
    const targetOnlyTables = new Set(result.tableSummary.filter(t => t.status === 'only_in_target').map(t => t.table_name));
    const droppedTables = new Set();
    for (const col of result.onlyIn2) {
        if (targetOnlyTables.has(col.table_name)) {
            if (!droppedTables.has(col.table_name)) {
                droppedTables.add(col.table_name);
                sqls.push(`-- Table only in ${result.label2}, not in ${result.label1} — drop if intended:`);
                sqls.push(`-- DROP TABLE "${col.table_name}";`);
            }
        }
        else {
            sqls.push(`-- Column only in ${result.label2}, not in ${result.label1} — drop if intended:`);
            sqls.push(`-- ALTER TABLE "${col.table_name}" DROP COLUMN "${col.column_name}";`);
        }
    }
    return sqls;
}
