export declare function directory_Exists(dirPath: string, caller?: string): Promise<boolean>;
export declare function directory_create(dirPath: string, caller?: string): Promise<boolean>;
export declare function directory_delete(dirPath: string, caller?: string): Promise<boolean>;
export declare function directory_list(dirPath: string, caller?: string): Promise<string[]>;
export declare function file_exists(filePath: string, caller?: string): Promise<boolean>;
export declare function file_count_json(filePath: string, caller?: string): Promise<number>;
export declare function file_delete(filePath: string, caller?: string): Promise<boolean>;
export declare function convertCsvToJson(dirPath: string, file_in: string, file_out: string, caller?: string): Promise<void>;
interface Props {
    table: string;
    dirPath: string;
    file_out: string;
}
export declare function table_write_toJSON(Props: Props, caller?: string): Promise<boolean>;
export declare function table_write_fromJSON(filePath: string, tableName: string, caller?: string): Promise<number>;
export {};
