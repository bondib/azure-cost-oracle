import { ResourcePricing, CostEstimate } from "../types";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";

dotenv.config();

// Get environment variables
const endpoint = process.env.AZURE_INFERENCE_ENDPOINT || "";
const apiKey = process.env.AZURE_INFERENCE_API_KEY || "";
const modelName = process.env.AZURE_INFERENCE_MODEL_NAME || "";

export async function generateCostEstimate(resources: ResourcePricing[]): Promise<string> {
  // Calculate total cost
  let totalCost = 0;
  let currency = "USD";

  resources.forEach(resource => {
    // Assuming 730 hours in a month (average)
    const monthlyCost = resource.pricing.retailPrice * 730;
    totalCost += monthlyCost;
    currency = resource.pricing.currencyCode;
  });

  const costEstimate: CostEstimate = {
    resources,
    totalCost,
    currency,
    monthlyCost: totalCost
  };

  if (!endpoint || !apiKey || !modelName) {
    throw new Error("Missing Azure AI Inference endpoint, API key, or model name.");
  }

  const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));

  const resourcesJson = JSON.stringify(costEstimate, null, 2);
  const prompt = `You are an expert Azure FinOps analyst. Generate a human-friendly cost estimate report for the following Azure resources. Include a summary of total monthly cost, breakdown by resource type, and any potential cost optimization recommendations. If the resource has no pricing information (noInfo:true), try to provide estimate by yourself - but mention it's your estimation! \n\nResource and pricing details:\n${resourcesJson}\n\nFormat your response as a professional report with sections for Summary, Detailed Breakdown, and Recommendations.\n\nIMPORTANT: Return your response as valid, styled HTML (using <h2>, <h3>, <ul>, <li>, <table>, etc.) that can be rendered directly in a web browser. Do not use Markdown or RST. Do not include any explanations or text outside the HTML.`;

  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are an expert Azure FinOps analyst." },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.1,
        presence_penalty: 0,
        frequency_penalty: 0,
        model: modelName
      }
    });

    if (response.status !== "200") {
      // ErrorResponse type
      throw (response.body as any).error || response.body;
    }
    // ChatCompletionsOutput type
    const body = response.body as any;
    if (body.choices && body.choices.length > 0) {
      let content = body.choices[0].message.content || "";
      // Remove markdown code block if present
      content = content.trim();
      if (content.startsWith("```html")) {
        content = content.replace(/^```html/, "").replace(/```$/, "").trim();
      } else if (content.startsWith("```")) {
        content = content.replace(/^```/, "").replace(/```$/, "").trim();
      }
      // Replace escaped newlines with nothing (we don't want to html print \n...)
      content = content.replace(/\\n/g, "");
      return content;
    }
    return "No cost estimate could be generated.";
  } catch (error) {
    console.error("Error generating cost estimate:", error);
    throw error;
  }
}