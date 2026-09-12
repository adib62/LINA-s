export interface ToolResult {
    success: boolean;
    message?: string;
    data?: unknown;
}

export interface Tool {

    name: string;

    description: string;

    parameters: Record<string, unknown>;

    execute(args: Record<string, unknown>): Promise<ToolResult>;

}