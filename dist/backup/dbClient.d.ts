import { Client } from 'pg';
export declare function readEnvVar(envFile: string, varName: string): string;
export declare function read_url(envFile: string): string;
export declare function read_location(envFile: string): string;
export declare function createClient(envFile?: string): Promise<Client>;
