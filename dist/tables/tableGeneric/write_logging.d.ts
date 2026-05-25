type Props = {
    lg_functionname: string;
    lg_msg: string;
    lg_severity?: string;
    lg_caller: string;
};
export declare function write_Logging({ lg_functionname, lg_msg, lg_severity, lg_caller }: Props): Promise<boolean>;
export {};
