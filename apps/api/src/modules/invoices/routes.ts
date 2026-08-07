import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db";
import { extractInvoiceData, extractInvoiceDataHeuristically } from "../../integrations/ai/client";

export const invoicesRouter = Router();

const createInvoiceSchema = z.object({
  companyId: z.string(),
  invoiceNumber: z.string(),
  rawText: z.string(),
  documentUrl: z.string().optional(),
});

invoicesRouter.post("/", async (req, res) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { companyId, invoiceNumber, rawText, documentUrl } = parsed.data;

  const invoice = await prisma.invoice.create({
    data: {
      companyId,
      invoiceNumber,
      documentUrl,
      supplierName: "Pending analysis",
      amount: 0,
      paymentTerms: "",
      status: "ANALYZING",
    },
  });

  try {
    const extraction = await extractInvoiceData(rawText);
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        supplierName: extraction.supplierName,
        amount: extraction.amount,
        currency: extraction.currency,
        paymentTerms: extraction.paymentTerms,
        aiRiskScore: extraction.riskScore,
        aiRecommendation: extraction.recommendation,
        status: "ANALYZED",
      },
    });
    return res.status(201).json({ invoice: updated, extraction });
  } catch (err) {
    // OpenAI is best-effort — fall back to a regex-based reading of the same
    // invoice text so the workflow still produces a usable trade proposal.
    const extraction = extractInvoiceDataHeuristically(rawText);
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        supplierName: extraction.supplierName,
        amount: extraction.amount,
        currency: extraction.currency,
        paymentTerms: extraction.paymentTerms,
        aiRiskScore: extraction.riskScore,
        aiRecommendation: extraction.recommendation,
        status: "ANALYZED",
      },
    });
    return res.status(201).json({
      invoice: updated,
      extraction,
      warning: `AI extraction unavailable, used heuristic fallback: ${(err as Error).message}`,
    });
  }
});

invoicesRouter.get("/", async (req, res) => {
  const companyId = req.query.companyId as string | undefined;
  const invoices = await prisma.invoice.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  res.json({ invoices });
});
