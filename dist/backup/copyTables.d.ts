export type CopyEvent = 'DROP' | 'CREATE_TABLE' | 'COPY' | 'INDEX' | 'SEQUENCE' | 'ERROR';
export type CopyLog = {
    event: CopyEvent;
    detail: string;
};
export type CopyResult = {
    success: boolean;
    logs: CopyLog[];
};
export declare function read_url(envFile: string): Promise<string>;
export declare function read_location(envFile: string): Promise<string>;
export type EnvFile = {
    file: string;
    location: string;
};
export declare function list_env_files(dir: string): Promise<EnvFile[]>;
export declare function get_tables({ url, caller }: {
    url: string;
    caller?: string;
}): Promise<string[]>;
export declare function copy_tables({ sourceUrl, targetUrl, tables, sourceLabel, targetLabel, caller }: {
    sourceUrl: string;
    targetUrl: string;
    tables: string[];
    sourceLabel?: string;
    targetLabel?: string;
    caller?: string;
}): Promise<CopyResult>;
