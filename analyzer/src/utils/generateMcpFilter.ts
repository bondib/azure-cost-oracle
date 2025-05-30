import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";
dotenv.config();

const endpoint = process.env.AZURE_INFERENCE_ENDPOINT || "";
const apiKey = process.env.AZURE_INFERENCE_API_KEY || "";
const modelName = process.env.AZURE_INFERENCE_MODEL_NAME || "";

function getInferenceClient() {
  if (!endpoint || !apiKey || !modelName) {
    throw new Error("Missing Azure AI Inference endpoint, API key, or model name.");
  }
  return ModelClient(endpoint, new AzureKeyCredential(apiKey));
}

export async function generateMcpFilter(resource: any, filterSchema: any, allowSkuName: boolean = false): Promise<any> {
  const filterSchemaDescription = typeof filterSchema === 'string' ? filterSchema : JSON.stringify(filterSchema, null, 2);
  const client = getInferenceClient();
  const prompt = `You are an expert in Azure pricing APIs. We have the following MCP filter schema description (as JSON Schema):\n\n***${filterSchemaDescription}***\n\nGiven the following resource:\n${JSON.stringify(resource, null, 2)}\n\nGenerate a MINIMAL filter (as a JSON object) that we will invoke to search for the pricing to get the price for this resource. ${allowSkuName ? "" : "DO NOT USE skuName in the filter! "}Initially, only use the following fields to construct the filter: "armSkuName", "armRegionName", and "serviceName". Only output the JSON object.`;

  console.log("Prompt: ", prompt);

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "You are an expert in Azure pricing APIs." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.2,
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
  const content = body.choices[0].message.content || "{}";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : content;
  return JSON.parse(jsonString);
}