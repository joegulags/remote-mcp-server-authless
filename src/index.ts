import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { McpAgent } from "agents/mcp";

// Export the agent class for Durable Object binding
export class MyMCP extends McpAgent {
	// Server instance can be initialized here or in constructor/init
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	// Tool initialization - McpAgent base class constructor/lifecycle should call this
	async init() {
		// Simple addition tool
		this.server.tool(
			"add",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			})
		);

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			}
		);
	}

	// The McpAgent base class (and Durable Object infrastructure)
	// provides the actual fetch method called by the stub below.
}

// Default export: Worker fetch handler using Durable Objects
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Use a consistent name for the Durable Object instance
		const durableObjectName = "mcp-agent"; 
		let id = env.MCP_OBJECT.idFromName(durableObjectName);
		let stub = env.MCP_OBJECT.get(id);

		// Forward the request to the Durable Object's fetch handler
		return stub.fetch(request);
	},
};
