"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Trade, MilestoneStatus } from "@/lib/mock-data";
import { releaseMilestone } from "@/lib/api";

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  released: "Released",
  in_escrow: "In escrow",
  pending: "Pending",
};

export function TradeDetailClient({ trade }: { trade: Trade }) {
  const [milestones, setMilestones] = useState(trade.milestones);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextIndex = milestones.findIndex((m) => m.status !== "released");
  const canRelease = nextIndex !== -1 && milestones[nextIndex].status === "in_escrow";

  function releaseNext() {
    const milestone = milestones[nextIndex];
    setError(null);

    startTransition(async () => {
      try {
        await releaseMilestone(trade.id, milestone.id);
      } catch (err) {
        // Backend/DB may not be provisioned yet — keep the demo usable by
        // still reflecting the release optimistically in the UI.
        setError(
          `Could not persist release to the API (${(err as Error).message}). Showing optimistic result only.`
        );
      }
      setMilestones((prev) =>
        prev.map((m, i) => (i === nextIndex ? { ...m, status: "released" } : m))
      );
    });
  }

  const releasedAmount = milestones
    .filter((m) => m.status === "released")
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <div className="mb-1 text-sm text-slate-500">{trade.invoiceNumber}</div>
          <div className="mb-1 text-lg font-semibold text-navy">
            {trade.supplier}
          </div>
          <div className="mb-3 text-2xl font-semibold text-graphite">
            ${trade.totalAmount.toLocaleString("en-US")} USDC
          </div>
          <Badge tone="pending">{trade.status}</Badge>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Payment Flow
          </h3>
          <div className="flex items-stretch justify-between gap-2">
            {milestones.map((m, i) => (
              <div key={m.label} className="flex flex-1 items-center gap-2">
                <div className="flex-1 rounded-lg border border-slate-200 p-3 text-center">
                  <div className="text-xs font-medium uppercase text-slate-400">
                    {m.label}
                  </div>
                  <div className="my-1 text-lg">
                    {m.status === "released" ? "✓" : m.status === "in_escrow" ? "●" : "○"}
                  </div>
                  <div className="text-sm font-semibold text-graphite">
                    ${m.amount.toLocaleString("en-US")}
                  </div>
                  <div className="text-xs text-slate-500">
                    {STATUS_LABEL[m.status]}
                  </div>
                </div>
                {i < milestones.length - 1 && (
                  <div className="text-slate-300">→</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Onchain Status
          </h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">Network</dt>
              <dd className="font-medium text-graphite">{trade.network}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Contract</dt>
              <dd className="font-mono text-xs font-medium text-graphite">
                {trade.contractAddress}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Released</dt>
              <dd className="font-medium text-graphite">
                ${releasedAmount.toLocaleString("en-US")} USDC
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Settlement</dt>
              <dd className="font-medium text-graphite">
                {canRelease ? "Ready to release" : "Awaiting delivery"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <div>
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-navy">
            TradePilot Agent
          </h3>
          {canRelease ? (
            <>
              <p className="mb-4 text-sm text-slate-600">
                The next milestone (
                <span className="font-medium text-graphite">
                  {milestones[nextIndex].label}
                </span>
                ) is eligible for release.
              </p>
              <div className="mb-4 text-2xl font-semibold text-graphite">
                ${milestones[nextIndex].amount.toLocaleString("en-US")} USDC
              </div>
              <Button className="w-full" onClick={releaseNext} disabled={isPending}>
                {isPending ? "Releasing…" : "Release payment"}
              </Button>
              {error && (
                <p className="mt-3 text-xs text-amber-600">{error}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600">
              All milestones for this trade have been released.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
