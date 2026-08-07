import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db";
import { createCompanyWallet, getWalletBalance } from "../../integrations/circle/client";

export const walletsRouter = Router();

const createWalletSchema = z.object({
  companyId: z.string(),
});

walletsRouter.post("/", async (req, res) => {
  const parsed = createWalletSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const walletSetId = process.env.CIRCLE_WALLET_SET_ID;
  if (!walletSetId) {
    return res.status(500).json({ error: "CIRCLE_WALLET_SET_ID is not configured" });
  }

  try {
    const circleWallet = await createCompanyWallet({ walletSetId });
    const wallet = await prisma.wallet.create({
      data: {
        companyId: parsed.data.companyId,
        circleWalletId: circleWallet.id,
        address: circleWallet.address,
        accountType: circleWallet.accountType,
        blockchain: circleWallet.blockchain,
      },
    });
    res.status(201).json({ wallet });
  } catch (err) {
    res.status(502).json({ error: `Circle wallet creation failed: ${(err as Error).message}` });
  }
});

walletsRouter.get("/", async (req, res) => {
  const companyId = req.query.companyId as string | undefined;
  const wallets = await prisma.wallet.findMany({
    where: companyId ? { companyId } : undefined,
  });
  res.json({ wallets });
});

walletsRouter.get("/:id/balance", async (req, res) => {
  const wallet = await prisma.wallet.findUnique({ where: { id: req.params.id } });
  if (!wallet) return res.status(404).json({ error: "Wallet not found" });

  try {
    const balance = await getWalletBalance(wallet.circleWalletId);
    res.json(balance);
  } catch (err) {
    res.status(502).json({ error: `Circle balance lookup failed: ${(err as Error).message}` });
  }
});
