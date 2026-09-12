import { registry } from "./registry";
import { ToolCall } from "./toolCall";
import { ToolResult } from "./tool";

export async function dispatchTool(
    toolCall: ToolCall
): Promise<ToolResult> {

    const tool = registry.get(toolCall.name);

    if (!tool) {

        return {
            success: false,
            message: `Tool "${toolCall.name}" tidak ditemukan.`
        };

    }

    try {

        return await tool.execute(toolCall.args);

    } catch (error) {

        return {

            success: false,

            message:
                error instanceof Error
                    ? error.message
                    : "Unknown Tool Error"

        };

    }

}