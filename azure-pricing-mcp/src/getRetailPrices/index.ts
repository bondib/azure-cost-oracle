import { filterSchema } from "./schema";

/**
 * @mcpTool
 * @name get_retail_prices
 * @description Fetches Azure retail prices using flexible filtering.
 * @inputSchema filterSchema
 */
const httpTrigger = async function (context: any, req: any): Promise<void> {
  try {
    // Validate input
    const parseResult = filterSchema.safeParse(req.body);
    if (!parseResult.success) {
      context.res = {
        status: 400,
        body: { error: "Invalid input", details: parseResult.error.errors }
      };
      return;
    }
    const filter = parseResult.data;

    // Call the retail prices fetcher (to be implemented)
    const prices = await fetchRetailPrices(filter);

    context.res = {
      status: 200,
      body: prices
    };
  } catch (err: any) {
    context.log.error("Error in get_retail_prices:", err);
    context.res = {
      status: 500,
      body: { error: "Internal server error", details: err.message }
    };
  }
};

export default httpTrigger;

// Polyfill fetch for Node.js <18
if (typeof fetch === 'undefined') {
  // @ts-ignore
  global.fetch = (...args: any[]) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

// Placeholder for the actual retail prices fetch logic
async function fetchRetailPrices(filter: Record<string, any>): Promise<any> {
  // Construct query string from filter object
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  const apiUrl = `https://prices.azure.com/api/retail/prices?${params.toString()}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Azure Retail Prices API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (err: any) {
    return { error: 'Failed to fetch Azure Retail Prices', details: err.message };
  }
}