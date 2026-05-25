type QueryOptions = {
    query: string;
    params?: any[];
    functionName?: string;
    caller: string;
    noLog?: boolean;
};
export declare function sql(): Promise<{
    query: (options: QueryOptions) => Promise<any>;
}>;
export {};
