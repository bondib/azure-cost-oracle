# Azure Pricing MCP Server

This project implements an Azure Functions MCP server exposing the `get_retail_prices` tool, which fetches Azure retail prices using flexible filtering.

## Features
- **MCP Tool:** `get_retail_prices` (HTTP POST)
- **Input Schema:** Validated with [zod](https://github.com/colinhacks/zod)
- **Azure Functions v4** (TypeScript)

## Project Structure
```
azure-pricing-mcp/
  src/
    getRetailPrices/
      index.ts        # Azure Function entry point
      schema.ts       # Zod schema for filter
      function.json   # Azure Functions binding config
  package.json
  tsconfig.json
  host.json
  local.settings.json
```

## Local Development

### Prerequisites
- Node.js 18+
- [Azure Functions Core Tools](https://docs.microsoft.com/azure/azure-functions/functions-run-local)
- [Azurite](https://docs.microsoft.com/azure/storage/common/storage-use-azurite?tabs=visual-studio) (for local storage emulation)

### Install dependencies
```
npm install
```

### Build
```
npm run build
```

### Run Locally
```
npm run start
```

The function will be available at:
```
POST http://localhost:7071/api/getRetailPrices
```

#### Example Request
```
curl -X POST http://localhost:7071/api/getRetailPrices \
  -H "Content-Type: application/json" \
  -d '{ "currencyCode": "USD", "serviceName": "Virtual Machines" }'
```

## MCP Integration
- This function is designed to be exposed as an MCP tool via Azure Functions' new MCP support (SSE endpoint).
- Add metadata and configure as needed for your MCP client (e.g., VS Code, Copilot, MCP Inspector).

## Next Steps
- Implement the actual Azure Retail Prices API call in `fetchRetailPrices` in `index.ts`.
- Deploy to Azure and connect from your MCP client.