import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { AzureResource } from "../types";
import dotenv from "dotenv";

dotenv.config();

// Get environment variables
const endpoint = process.env.AZURE_INFERENCE_ENDPOINT || "";
const apiKey = process.env.AZURE_INFERENCE_API_KEY || "";
const modelName = process.env.AZURE_INFERENCE_MODEL_NAME || "";

export async function extractResourcesFromTemplate(template: string): Promise<AzureResource[]> {
  if (!endpoint || !apiKey || !modelName) {
    throw new Error("Missing Azure AI Inference endpoint, API key, or model name.");
  }
  const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));

  const prompt = `Given the following ARM or Terraform template, extract a JSON array of all resources which might cost money, each with:\n* resourceType (e.g. Microsoft.Compute/virtualMachines)\n* sku or tier (e.g. Standard_D2s_v3)\n* capacity or size (e.g. 2 vCPUs, 8 GiB)\n* armRegionName (e.g. eastus)\n\nReturn strictly valid JSON.\n\nTemplate:\n${template}`;

  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are an expert Azure FinOps architect." },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        top_p: 0.1,
        presence_penalty: 0,
        frequency_penalty: 0,
        model: modelName
      }
    });

    if (response.status !== "200") {
      throw (response.body as any).error || response.body;
    }
    const body = response.body as any;
    if (body.choices && body.choices.length > 0) {
      const content = body.choices[0].message.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      try {
        const resources = JSON.parse(jsonString) as AzureResource[];
        return resources;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error calling Azure AI Inference:", error);
    throw error;
  }
}