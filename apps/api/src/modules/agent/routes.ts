import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db";

export const agentRouter = Router();

const createActionSchema = z.object({
  tradeId: z.string(),
  type: z.enum(["CREATE_ESCROW", "CONFIRM_MILESTONE", "RELEASE_MILESTONE", "RAISE_DISPUTE"]),
  description: z.string(),
  amount: z.number().optional(),
});

/**
 * The agent never moves funds directly. It only proposes an action, which
 * lands here as PENDING_APPROVAL. A human must call /approve before the
 * corresponding trade/wallet endpoint is invoked — see docs/agent.md for the
 * full trust boundary.
 */
agentRouter.post("/actions", async (req, res) => {
  const parsed = createActionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const action = await prisma.agentAction.create({
    data: { ...parsed.data, requiresApproval: true, status: "PENDING_APPROVAL" },
  });
  res.status(201).json({ action });
});

agentRouter.get("/actions", async (req, res) => {
  const tradeId = req.query.tradeId as string | undefined;
  const actions = await prisma.agentAction.findMany({
    where: tradeId ? { tradeId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  res.json({ actions });
});

agentRouter.post("/actions/:id/approve", async (req, res) => {
  const action = await prisma.agentAction.update({
    where: { id: req.params.id },
    data: { status: "APPROVED" },
  });
  res.json({ action });
});

agentRouter.post("/actions/:id/reject", async (req, res) => {
  const action = await prisma.agentAction.update({
    where: { id: req.params.id },
    data: { status: "REJECTED" },
  });
  res.json({ action });
});
