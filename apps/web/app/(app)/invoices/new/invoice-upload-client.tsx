"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoCompany, createInvoice, createTrade } from "@/lib/api";

type Stage = "idle" | "analyzing" | "analyzed";

const SAMPLE_INVOICE_TEXT = `Invoice INV-2048
Supplier: European Industrial GmbH
Amount: $100,000 USD
Payment terms: 30% on order, 40% on shipment, 30% on delivery
Goods: Industrial equipment, ex-works Hamburg`;

type Analysis = {
  supplierName: string;
  amount: string;
  currency: string;
  paymentTerms: string;
  riskScore: string;
};

const FALLBACK_ANALYSIS: Analysis = {
  supplierName: "European Industrial GmbH",
  amount: "100,000",
  currency: "USD",
  paymentTerms: "30 / 40 / 30",
  riskScore: "Low",
};

export function InvoiceUploadClient() {
  const [stage, setStage] = useState<Stage>("idle");
  const [analysis, setAnalysis] = useState<Analysis>(FALLBACK_ANALYSIS);
  const [tradeTarget, setTradeTarget] = useState<{ invoiceId: string; buyerId: string } | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload() {
    setStage("analyzing");
    try {
      const company = await getDemoCompany();
      const result = await createInvoice({
        companyId: company.id,
        invoiceNumber: `INV-${Math.floor(2000 + Math.random() * 999)}`,
        rawText: SAMPLE_INVOICE_TEXT,
      });
      setAnalysis({
        supplierName: result.invoice.supplierName,
        amount: Number(result.invoice.amount).toLocaleString("en-US"),
        currency: result.invoice.currency,
        paymentTerms: result.invoice.paymentTerms || "30 / 40 / 30",
        riskScore: result.invoice.aiRiskScore ?? "Low",
      });
      setTradeTarget({ invoiceId: result.invoice.id, buyerId: company.id });
      if (result.warning) setNotice(result.warning);
    } catch (err) {
      // API/DB not provisioned yet — fall back to a canned analysis so the
      // demo flow stays walkable end-to-end.
      setNotice(`Using offline demo data (${(err as Error).message})`);
      setAnalysis(FALLBACK_ANALYSIS);
      setTradeTarget(null);
    } finally {
      setStage("analyzed");
    }
  }

  async function handleCreateTrade() {
    if (!tradeTarget) {
      router.push("/trades/inv-2048");
      return;
    }
    setIsCreating(true);
    try {
      const trade = await createTrade(tradeTarget);
      router.push(`/trades/${trade.id}`);
    } catch (err) {
      setNotice(`Could not create the trade via the API (${(err as Error).message}).`);
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        {stage === "idle" && (
          <button
            onClick={handleUpload}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-12 text-slate-400 hover:border-accent hover:text-accent"
          >
            <UploadCloud size={28} />
            <span className="text-sm font-medium">Drop invoice here</span>
            <span className="text-xs">PDF / JPG / PNG</span>
          </button>
        )}

        {stage === "analyzing" && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-accent" />
            <span className="text-sm">Analyzing invoice…</span>
          </div>
        )}

        {stage === "analyzed" && (
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              AI Analysis
            </h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Supplier" value={analysis.supplierName} />
              <Field label="Amount" value={`$${analysis.amount}`} />
              <Field label="Currency" value={analysis.currency} />
              <Field label="Payment terms" value={analysis.paymentTerms} />
              <Field label="Suggested workflow" value="Milestone escrow" />
              <div>
                <dt className="text-slate-400">Risk</dt>
                <dd>
                  <Badge tone="success">{analysis.riskScore}</Badge>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </Card>

      {notice && <p className="text-xs text-amber-600">{notice}</p>}

      {stage === "analyzed" && (
        <Button className="w-full" onClick={handleCreateTrade} disabled={isCreating}>
          {isCreating ? "Creating trade…" : "Create trade"}
        </Button>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-graphite">{value}</dd>
    </div>
  );
}
