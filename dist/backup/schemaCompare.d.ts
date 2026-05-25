import { Client } from 'pg';
export type SchemaRow = {
    sc_table: string;
    sc_column: string;
    sc_datatype: string | null;
    sc_maxlen: number | null;
    sc_nullable: string | null;
    sc_default: string | null;
    sc_is_pk: boolean;
    sc_is_unique: boolean;
    sc_has_index: boolean;
};
export type SchemaDiff = {
    direction: 'only_in_1' | 'only_in_2';
    row: SchemaRow;
};
export declare function schemaSnapshot(sourceClient: Client, source: string, storeClient?: Client): Promise<void>;
export declare function schemaCompare(storeClient: Client, source1: string, source2: string): Promise<SchemaDiff[]>;
