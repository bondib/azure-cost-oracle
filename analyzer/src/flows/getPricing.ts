import { AzureResource, ResourcePricing } from "../types";
import { RetailPricesController, IContext } from "../services/RetailPricesController";
import { generateMcpFilter } from "../utils/generateMcpFilter";

class Logger implements IContext {
  log(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }
}

const MAX_MCP_FILTER_ATTEMPTS = parseInt(process.env.MCP_FILTER_ATTEMPTS || "3");

export async function getPricingForResources(resources: AzureResource[]): Promise<ResourcePricing[]> {
  const controller = new RetailPricesController(new Logger());
  const resourcesWithPricing: ResourcePricing[] = [];

  let client: any = null;
  let inputSchema: any = null;
  try {
    // Connect and get the dynamic inputSchema for the tool
    const result = await controller.connectAndGetRetailPricesSchema();
    client = result.client;
    inputSchema = result.inputSchema;
  } catch (err) {
    console.error("Failed to connect to MCP server or fetch schema:", err);
    // Return all resources with empty pricing if schema/client cannot be fetched
    return resources.map(resource => ({
      ...resource,
      pricing: {
        retailPrice: 0,
        unitPrice: 0,
        currencyCode: "USD",
        unitOfMeasure: "N/A"
      }
    }));
  }

  let index = 0;

  for (const resource of resources) {
    try {
      index++;
      // Use the inputSchema (JSON Schema) as the description for the AI
      console.log("Generating MCP filter for resource ", index, " of ", resources.length);
      let filter = await generateMcpFilter(resource, JSON.stringify(inputSchema, null, 2));
      let pricingData = await controller.callRetailPricesTool(client, filter);
      let attempt = 1;
      let lastFilter = filter;
      let lastResponse = pricingData;
      const allFilters: any[] = [filter];

      console.log(`[AI MCP Filter Attempt ${attempt}]`, JSON.stringify(filter, null, 2));
      console.log(`[MCP Response Attempt ${attempt}]`, JSON.stringify(pricingData, null, 2));

      while ((!pricingData.data || pricingData.data.length === 0) && attempt < MAX_MCP_FILTER_ATTEMPTS) {
        attempt++;
        // Give feedback to the AI about the failure and all previous filters
        const feedback = `The previous filter returned zero results from the MCP API. Please try to create a different filter for this resource. Less is more! Previous filters used that returned zero results: ${JSON.stringify(allFilters, null, 2)}`;
        filter = await generateMcpFilter(resource, JSON.stringify(inputSchema, null, 2) + "\n" + feedback, attempt >= 2);
        pricingData = await controller.callRetailPricesTool(client, filter);
        lastFilter = filter;
        lastResponse = pricingData;
        allFilters.push(filter);
        console.log(`[AI MCP Filter Attempt ${attempt}]`, JSON.stringify(filter, null, 2));
        console.log(`[MCP Response Attempt ${attempt}]`, JSON.stringify(pricingData, null, 2));
      }

      if (pricingData.data && pricingData.data.length > 0) {
        // todo: handle multiple pricing data
        const pricing = pricingData.data[0];

        resourcesWithPricing.push({
          ...resource,
          pricing: {
            retailPrice: pricing.retailPrice,
            unitPrice: pricing.unitPrice,
            currencyCode: pricing.currencyCode,
            unitOfMeasure: pricing.unitOfMeasure
          }
        });
      } else {
        // No pricing data found, add resource with empty pricing
        resourcesWithPricing.push({
          ...resource,
          pricing: {
            retailPrice: 0,
            unitPrice: 0,
            currencyCode: "USD",
            unitOfMeasure: "N/A"
          }
        });
      }
    } catch (error) {
      console.error(`Error getting pricing for resource ${resource.resourceType}:`, error);

      // Add resource with empty pricing in case of error
      resourcesWithPricing.push({
        ...resource,
        pricing: {
          retailPrice: 0,
          unitPrice: 0,
          currencyCode: "USD",
          unitOfMeasure: "N/A"
        }
      });
    }
  }

  // Always close the client if it was opened
  if (client && typeof client.close === 'function') {
    try {
      await client.close();
    } catch (e) {
      console.error("Error closing MCP client:", e);
    }
  }

  return resourcesWithPricing;
}