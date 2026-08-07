import { Router } from "express";
import { prisma } from "../../db";

export const treasuryRouter = Router();

treasuryRouter.get("/:companyId", async (req, res) => {
  const { companyId } = req.params;

  const wallets = await prisma.wallet.findMany({
    where: { companyId },
    include: { transactions: true },
  });

  const trades = await prisma.trade.findMany({
    where: { buyerId: companyId },
  });

  const inEscrow = trades
    .filter((t) => t.status === "IN_PROGRESS")
    .reduce((sum, t) => sum + Number(t.totalAmount) - Number(t.releasedAmount), 0);

  const byNetwork = wallets.reduce<Record<string, number>>((acc, wallet) => {
    const total = wallet.transactions.reduce(
      (sum, tx) => sum + (tx.direction === "IN" ? Number(tx.amount) : -Number(tx.amount)),
      0
    );
    acc[wallet.blockchain] = (acc[wallet.blockchain] ?? 0) + total;
    return acc;
  }, {});

  const available = Object.values(byNetwork).reduce((a, b) => a + b, 0);

  res.json({
    total: available + inEscrow,
    available,
    inEscrow,
    byNetwork,
  });
});
