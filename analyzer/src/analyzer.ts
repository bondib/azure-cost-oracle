import { extractResourcesFromTemplate } from "./flows/extractResources";
import { getPricingForResources } from "./flows/getPricing";
import { generateCostEstimate } from "./flows/generateCostEstimate";

export async function analyzeTemplate(template: string, htmlOnly = false) {
  console.log("Analyzing template...");
  // Step 1: Extract resources from the template
  const resources = await extractResourcesFromTemplate(template);
  console.log("Extracted resources:", resources);
  console.log("Fetching pricing information...");
  // Step 2: Get pricing information for each resource
  const resourcesWithPricing = await getPricingForResources(resources);
  console.log("Pricing information:", resourcesWithPricing);
  // Step 3: Generate human-friendly cost estimate
  console.log("Generating cost estimate report...");
  const costEstimate = await generateCostEstimate(resourcesWithPricing);
  console.log("Cost estimate ready!");
  if (htmlOnly) return costEstimate;
  return { costEstimate, resources, resourcesWithPricing };
}