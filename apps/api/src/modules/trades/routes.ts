import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db";
import { MILESTONE_SPLIT } from "@tradepilot/config";
import { transferUsdc } from "../../integrations/circle/client";

export const tradesRouter = Router();

const createTradeSchema = z.object({
  invoiceId: z.string(),
  buyerId: z.string(),
  milestones: z
    .array(z.object({ label: z.string(), sharePercent: z.number(), condition: z.string() }))
    .optional(),
});

tradesRouter.post("/", async (req, res) => {
  const parsed = createTradeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { invoiceId, buyerId, milestones } = parsed.data;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const splitPlan =
    milestones ?? [
      { label: "Order", sharePercent: MILESTONE_SPLIT.order, condition: "ORDER_CONFIRMED" },
      { label: "Shipment", sharePercent: MILESTONE_SPLIT.shipment, condition: "SHIPMENT_CONFIRMED" },
      { label: "Delivery", sharePercent: MILESTONE_SPLIT.delivery, condition: "DELIVERY_CONFIRMED" },
    ];

  const totalAmount = Number(invoice.amount);

  const trade = await prisma.trade.create({
    data: {
      invoiceId,
      buyerId,
      supplierName: invoice.supplierName,
      totalAmount,
      status: "AWAITING_FUNDING",
      milestones: {
        create: splitPlan.map((m) => ({
          label: m.label,
          sharePercent: m.sharePercent,
          condition: m.condition,
          amount: (totalAmount * m.sharePercent) / 100,
          status: "PENDING",
        })),
      },
    },
    include: { milestones: true },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "TRADE_CREATED" },
  });

  res.status(201).json({ trade });
});

tradesRouter.get("/", async (req, res) => {
  const buyerId = req.query.buyerId as string | undefined;
  const trades = await prisma.trade.findMany({
    where: buyerId ? { buyerId } : undefined,
    include: { milestones: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ trades });
});

tradesRouter.get("/:id", async (req, res) => {
  const trade = await prisma.trade.findUnique({
    where: { id: req.params.id },
    include: { milestones: true, transactions: true, agentActions: true, invoice: true },
  });
  if (!trade) return res.status(404).json({ error: "Trade not found" });
  res.json({ trade });
});

/**
 * Fund the escrow: moves the trade from AWAITING_FUNDING to IN_PROGRESS and
 * marks the first milestone as in-escrow. The actual USDC lock happens via
 * the TradePilotEscrow contract on Arc — this endpoint tracks state once the
 * onchain fundTrade() transaction is confirmed.
 */
tradesRouter.post("/:id/fund", async (req, res) => {
  const { contractAddress, onchainTradeId } = req.body as {
    contractAddress: string;
    onchainTradeId: string;
  };

  const trade = await prisma.trade.update({
    where: { id: req.params.id },
    data: { status: "IN_PROGRESS", contractAddress, onchainTradeId },
    include: { milestones: true },
  });

  const firstPending = trade.milestones.find((m) => m.status === "PENDING");
  if (firstPending) {
    await prisma.milestone.update({
      where: { id: firstPending.id },
      data: { status: "IN_ESCROW" },
    });
  }

  res.json({ trade });
});

/**
 * Release the next eligible milestone. This is the endpoint the AI Agent
 * calls after the user approves its recommendation. It never signs a
 * transaction itself — it only requests the Circle developer-controlled
 * wallet to execute the transfer once approved by a human.
 */
tradesRouter.post("/:id/milestones/:milestoneId/release", async (req, res) => {
  const { destinationAddress, walletId, tokenId } = req.body as {
    destinationAddress?: string;
    walletId?: string;
    tokenId?: string;
  };

  const milestone = await prisma.milestone.findUnique({
    where: { id: req.params.milestoneId },
  });
  if (!milestone || milestone.tradeId !== req.params.id) {
    return res.status(404).json({ error: "Milestone not found" });
  }
  if (milestone.status !== "IN_ESCROW") {
    return res.status(409).json({ error: "Milestone is not eligible for release" });
  }

  let txHash: string | undefined;
  if (walletId && destinationAddress && tokenId) {
    try {
      const transfer = await transferUsdc({
        walletId,
        destinationAddress,
        amount: milestone.amount.toString(),
        tokenId,
      });
      txHash = transfer.data.id;
    } catch (err) {
      return res.status(502).json({ error: `Circle transfer failed: ${(err as Error).message}` });
    }
  }

  await prisma.milestone.update({
    where: { id: milestone.id },
    data: { status: "RELEASED", releasedAt: new Date() },
  });

  const trade = await prisma.trade.update({
    where: { id: req.params.id },
    data: { releasedAmount: { increment: milestone.amount } },
    include: { milestones: true },
  });

  const nextPending = trade.milestones.find((m) => m.status === "PENDING");
  if (nextPending) {
    await prisma.milestone.update({
      where: { id: nextPending.id },
      data: { status: "IN_ESCROW" },
    });
  } else {
    await prisma.trade.update({
      where: { id: trade.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await prisma.creditEvent.create({
      data: {
        companyId: trade.buyerId,
        label: `Trade ${trade.id} completed`,
        amount: trade.totalAmount,
        onTime: true,
      },
    });
  }

  res.json({ milestone: { ...milestone, status: "RELEASED" }, txHash });
});
