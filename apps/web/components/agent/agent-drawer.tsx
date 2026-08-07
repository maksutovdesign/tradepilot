"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function AgentDrawer({ onClose }: { onClose: () => void }) {
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
          className="mb-4 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:border-accent focus:outline-none"
          rows={2}
          defaultValue="Pay the supplier after shipment is confirmed."
        />

        <div className="rounded-xl border border-slate-200 bg-surface p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Suggested action
          </div>
          <div className="mb-1 text-sm font-semibold text-navy">
            Create milestone escrow
          </div>
          <div className="mb-4 text-2xl font-semibold text-graphite">
            $100,000 USDC
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Order</span>
              <span className="font-medium text-graphite">30%</span>
            </div>
            <div className="flex justify-between">
              <span>Shipment</span>
              <span className="font-medium text-graphite">40%</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="font-medium text-graphite">30%</span>
            </div>
          </div>
        </div>

        <Button className="mt-6 w-full">Approve workflow</Button>
      </div>
    </div>
  );
}
