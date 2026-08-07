import { Router } from "express";
import { prisma } from "../../db";

export const creditRouter = Router();

creditRouter.get("/:companyId", async (req, res) => {
  const { companyId } = req.params;

  const trades = await prisma.trade.findMany({
    where: { buyerId: companyId, status: "COMPLETED" },
  });
  const events = await prisma.creditEvent.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  const totalVolume = trades.reduce((sum, t) => sum + Number(t.totalAmount), 0);
  const onTimeCount = events.filter((e) => e.onTime).length;
  const onTimeRate = events.length ? (onTimeCount / events.length) * 100 : 100;

  res.json({
    totalVolume,
    completedTrades: trades.length,
    onTimeRate: Number(onTimeRate.toFixed(1)),
    disputes: trades.filter((t) => t.status === "DISPUTED").length,
    potentialFacility: Math.round(totalVolume * 0.15),
    history: trades.slice(0, 10).map((t) => ({
      tradeId: t.id,
      amount: Number(t.totalAmount),
      status: "paid",
    })),
  });
});
