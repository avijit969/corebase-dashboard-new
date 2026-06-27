export type TriggerType = "http" | "cron" | "event";
export type FunctionStatus = "draft" | "deployed" | "failed";
export type EventOp = "insert" | "update" | "delete" | "auth.signup";

export interface FunctionDef {
    id: string;
    user_id?: string;
    name: string;
    description?: string;
    code?: string; // present on GET /:id, omitted from list
    main_module?: string;
    compatibility_date?: string;
    script_name?: string;
    status: FunctionStatus;
    trigger_type: TriggerType;
    cron_expression?: string | null;
    event_table?: string | null;
    event_op?: string | null;
    is_active?: number;
    version?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Deployment {
    id: string;
    function_id: string;
    version: number;
    script_name: string;
    status: string; // success | failed
    cf_errors?: string | null;
    deployed_by?: string | null;
    created_at: string;
}

export interface Invocation {
    id: string;
    function_id: string;
    script_name: string;
    trigger_source: string; // http | cron | event
    status: string; // success | failed
    http_status?: number | null;
    duration_ms?: number | null;
    error?: string | null;
    created_at: string;
}
