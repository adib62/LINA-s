import { Tool } from "./tool";

class ToolRegistry {

    private readonly tools = new Map<string, Tool>();

    register(tool: Tool): void {

        this.tools.set(tool.name, tool);

    }

    get(name: string): Tool | undefined {

        return this.tools.get(name);

    }

    getAll(): Tool[] {

        return [...this.tools.values()];

    }

    buildPrompt(exclude: string[] = []): string {

        return this.getAll()
            .filter(tool => !exclude.includes(tool.name))
            .map(tool => {

                return `
Nama:
${tool.name}

Deskripsi:
${tool.description}

Parameter:
${JSON.stringify(tool.parameters, null, 4)}
`;

            })
            .join("\n");

    }

}

export const registry = new ToolRegistry();