import { z } from 'zod';

export interface IContext {
  log: (message: string) => void;
  error: (message: string) => void;
}

// Polyfill fetch for Node.js <18
if (typeof fetch === 'undefined') {
  // @ts-ignore
  global.fetch = (...args: any[]) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

export class RetailPricesController {
  private context: IContext;

  constructor(context: IContext) {
    this.context = context;
  }

  /**
   * Connects to the MCP server, fetches the inputSchema for 'get_retail_prices', and returns both the client and the schema.
   */
  async connectAndGetRetailPricesSchema(): Promise<{ client: any, inputSchema: any }> {
    const mcpMode = process.env.MCP_MODE || 'real';
    const mcpUrl = process.env.MCP_URL || 'http://localhost:8000/retail-prices/mcp/sse';
    this.context.log(`MCP_MODE: ${mcpMode}`);
    if (mcpMode !== 'real') {
      throw new Error('Mock mode is not supported for dynamic schema fetching.');
    }
    // Dynamically import MCPClient for ESM compatibility
    const mcpModule = await import('mcp-client');
    const MCPClient = mcpModule.MCPClient;
    const client = new MCPClient({ name: "retail-prices-client", version: "1.0.0" });
    await client.connect({
      type: "sse",
      url: mcpUrl,
    });
    console.log("Connected to MCP server");
    const tools = await client.getAllTools();
    const tool = tools.find((t: any) => t.name === 'get_retail_prices');
    if (!tool) {
      await client.close();
      throw new Error("Tool 'get_retail_prices' not found on MCP server");
    }
    const inputSchema = tool.inputSchema;
    if (!inputSchema) {
      await client.close();
      throw new Error("Tool 'get_retail_prices' does not have an inputSchema");
    }
    return { client, inputSchema };
  }

  /**
   * Calls the 'get_retail_prices' tool using an existing MCPClient and filter.
   */
  async callRetailPricesTool(client: any, filter: any): Promise<any> {
    try {
      const result = await client.callTool({
        name: "get_retail_prices",
        arguments: filter
      });
      return result;
    } catch (error) {
      this.context.error(`Error calling retail prices tool: ${error}`);
      throw error;
    }
  }
}