"use client";

import { Sparkles, ChevronDown } from "lucide-react";
import { useAgentDrawer } from "@/components/agent/agent-drawer";

export function Topbar() {
  const { open } = useAgentDrawer();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm font-medium text-slate-500">
        Dubai Trading LLC
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={open}
          className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-navy hover:bg-slate-50"
        >
          <Sparkles size={14} className="text-accent" />
          AI Agent
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        </button>
        <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
          Company
          <ChevronDown size={14} />
        </div>
      </div>
    </header>
  );
}
