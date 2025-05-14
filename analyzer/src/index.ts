import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeTemplate } from "./analyzer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "../public")));

app.post("/analyze", async (req: Request, res: Response) => {
  try {
    if (!process.env.AZURE_INFERENCE_ENDPOINT || !process.env.AZURE_INFERENCE_API_KEY || !process.env.AZURE_INFERENCE_MODEL_NAME) {
      return res.status(500).json({ error: "Missing required environment variables. Please set AZURE_INFERENCE_ENDPOINT, AZURE_INFERENCE_API_KEY, and AZURE_INFERENCE_MODEL_NAME." });
    }
    const { template } = req.body;
    if (!template) {
      return res.status(400).json({ error: "Missing 'template' in request body." });
    }
    const result = await analyzeTemplate(template);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// SSE endpoint for streaming analyzer logs and result
app.post("/analyze/stream", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Helper to send SSE messages
  const sendSSE = (event: string, data: any) => {
    if (event === "result") {
      const lines = String(data).split('\n');
      for (const line of lines) {
        res.write(`data: ${line}\n`);
      }
      res.write('\n');
    } else {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  // Patch console.log for this request
  const originalConsoleLog = console.log;
  console.log = (...args: any[]) => {
    const formatted = args.map(arg =>
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(" ");
    sendSSE("log", formatted);
    originalConsoleLog.apply(console, args);
  };

  try {
    if (!process.env.AZURE_INFERENCE_ENDPOINT || !process.env.AZURE_INFERENCE_API_KEY || !process.env.AZURE_INFERENCE_MODEL_NAME) {
      sendSSE("error", "Missing required environment variables. Please set AZURE_INFERENCE_ENDPOINT, AZURE_INFERENCE_API_KEY, and AZURE_INFERENCE_MODEL_NAME.");
      return res.end();
    }
    const { template } = req.body;
    if (!template) {
      sendSSE("error", "Missing 'template' in request body.");
      return res.end();
    }
    const result = await analyzeTemplate(template, true);
    sendSSE("result", result);
    res.end();
  } catch (error: any) {
    sendSSE("error", error.message || "Internal server error");
    res.end();
  } finally {
    console.log = originalConsoleLog;
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});