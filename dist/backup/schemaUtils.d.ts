import type { ArbitraryDb } from '../tables/dbArbitrary';
export type SchemaRow = {
    table_name: string;
    column_name: string;
    data_type: string;
    max_len: number | null;
    is_nullable: string;
    column_default: string | null;
    is_pk: boolean;
    is_unique: boolean;
    has_index: boolean;
};
export type DiffRow = SchemaRow & {
    side: string;
};
export type ChangeRow = {
    table_name: string;
    column_name: string;
    source: SchemaRow;
    target: SchemaRow;
};
export type TableStatus = 'identical' | 'different' | 'only_in_source' | 'only_in_target';
export type TableSummary = {
    table_name: string;
    status: TableStatus;
    count1?: number | null;
    count2?: number | null;
};
export type SchemaCompareResult = {
    label1: string;
    label2: string;
    onlyIn1: DiffRow[];
    onlyIn2: DiffRow[];
    changed: ChangeRow[];
    tableSummary: TableSummary[];
};
/** Query all columns in the public schema with PK, unique, and index flags. */
export declare function fetchSchema(db: ArbitraryDb): Promise<SchemaRow[]>;
/** Compare two SchemaRow arrays and return columns only in each side, changed columns, and a per-table status summary. */
export declare function diffSchemas(rows1: SchemaRow[], rows2: SchemaRow[], label1: string, label2: string): Omit<SchemaCompareResult, 'label1' | 'label2'>;
/** Generate ALTER TABLE / CREATE TABLE SQL to bring the target in line with the source; identity-column defaults are skipped with a comment. */
export declare function generateAlterSQL(result: SchemaCompareResult): string[];
