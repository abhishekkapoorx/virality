import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    service: "api",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

const inboundSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  text: z.string().min(1)
});

app.post("/v1/inbound", (req, res) => {
  const parsed = inboundSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }

  return res.status(202).json({
    message: "Inbound event accepted",
    workflowState: "intake_received"
  });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // Intentional single startup log for container health diagnostics
  console.log(`API running on http://localhost:${port}`);
});
