import "dotenv/config";
import "express-async-errors";
import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/routes";
import { invoicesRouter } from "./modules/invoices/routes";
import { tradesRouter } from "./modules/trades/routes";
import { agentRouter } from "./modules/agent/routes";
import { walletsRouter } from "./modules/wallets/routes";
import { treasuryRouter } from "./modules/treasury/routes";
import { creditRouter } from "./modules/credit/routes";

// Neon (and other serverless Postgres) suspend idle connections; a dropped
// connection surfaces as a rejected promise somewhere outside a request
// context. Log it instead of crashing the whole process.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/invoices", invoicesRouter);
app.use("/trades", tradesRouter);
app.use("/agent", agentRouter);
app.use("/wallets", walletsRouter);
app.use("/treasury", treasuryRouter);
app.use("/credit-passport", creditRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Also exported as default: if a platform's zero-config Express detection
// ever picks this file up directly as a serverless entrypoint (it shouldn't
// — see vercel.json's "framework": null — but did once), a default export
// keeps it a valid handler instead of crashing on "invalid export".
export default app;
