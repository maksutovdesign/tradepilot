"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDemoCompany, createInvoice, createTrade } from "@/lib/api";

type AgentDrawerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const AgentDrawerContext = createContext<AgentDrawerContextValue | null>(null);

export function useAgentDrawer() {
  const ctx = useContext(AgentDrawerContext);
  if (!ctx) {
    throw new Error("useAgentDrawer must be used within AgentDrawerProvider");
  }
  return ctx;
}

export function AgentDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AgentDrawerContext.Provider value={{ isOpen, open, close }}>
      {children}
      {isOpen && <AgentDrawer onClose={close} />}
    </AgentDrawerContext.Provider>
  );
}

const DEFAULT_REQUEST = `Invoice INV-3100
Supplier: Al Rostamani Precision Parts LLC
Amount: $64,000 USD
Payment terms: 30% on order, 40% on shipment, 30% on delivery
Pay the supplier as each milestone is confirmed.`;

type Stage = "idle" | "analyzing" | "proposed" | "creating";

type Proposal = {
  supplierName: string;
  amount: string;
  paymentTerms: string;
  invoiceId: string;
  buyerId: string;
};

function AgentDrawer({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState(DEFAULT_REQUEST);
  const [stage, setStage] = useState<Stage>("idle");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function handleAnalyze() {
    setStage("analyzing");
    setNotice(null);
    try {
      const company = await getDemoCompany();
      const result = await createInvoice({
        companyId: company.id,
        invoiceNumber: `INV-${Math.floor(3000 + Math.random() * 999)}`,
        rawText: text,
      });
      setProposal({
        supplierName: result.invoice.supplierName,
        amount: Number(result.invoice.amount).toLocaleString("en-US"),
        paymentTerms: result.invoice.paymentTerms || "30 / 40 / 30",
        invoiceId: result.invoice.id,
        buyerId: company.id,
      });
      if (result.warning) setNotice(result.warning);
      setStage("proposed");
    } catch (err) {
      setNotice(`Could not reach the agent backend (${(err as Error).message}).`);
      setProposal({
        supplierName: "European Industrial GmbH",
        amount: "100,000",
        paymentTerms: "30 / 40 / 30",
        invoiceId: "",
        buyerId: "",
      });
      setStage("proposed");
    }
  }

  async function handleApprove() {
    if (!proposal) return;
    if (!proposal.invoiceId) {
      onClose();
      router.push("/trades/inv-2048");
      return;
    }
    setStage("creating");
    try {
      const trade = await createTrade({
        invoiceId: proposal.invoiceId,
        buyerId: proposal.buyerId,
      });
      onClose();
      router.push(`/trades/${trade.id}`);
    } catch (err) {
      setNotice(`Could not create the trade (${(err as Error).message}).`);
      setStage("proposed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
      <div className="flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">
            TradePilot Agent
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <label className="mb-2 text-xs font-medium text-slate-500">
          What would you like to do?
        </label>
        <textarea
          className="mb-4 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:border-accent focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={stage !== "idle"}
        />

        {stage === "idle" && (
          <Button className="w-full" onClick={handleAnalyze}>
            Analyze request
          </Button>
        )}

        {stage === "analyzing" && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Reading invoice, checking treasury…
          </div>
        )}

        {(stage === "proposed" || stage === "creating") && proposal && (
          <>
            <div className="rounded-xl border border-slate-200 bg-surface p-4">
              <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                Suggested action
              </div>
              <div className="mb-1 text-sm font-semibold text-navy">
                Create milestone escrow — {proposal.supplierName}
              </div>
              <div className="mb-4 text-2xl font-semibold text-graphite">
                ${proposal.amount} USDC
              </div>
              <div className="text-sm text-slate-600">
                Payment terms: {proposal.paymentTerms}
              </div>
            </div>

            <Button
              className="mt-6 w-full"
              onClick={handleApprove}
              disabled={stage === "creating"}
            >
              {stage === "creating" ? "Creating trade…" : "Approve workflow"}
            </Button>
          </>
        )}

        {notice && <p className="mt-3 text-xs text-amber-600">{notice}</p>}
      </div>
    </div>
  );
}
