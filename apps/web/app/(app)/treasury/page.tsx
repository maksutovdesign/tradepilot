import { Card } from "@/components/ui/card";
import { getTreasuryData } from "@/lib/data";

export default async function TreasuryPage() {
  const treasury = await getTreasuryData();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-navy">Treasury</h1>

      <Card>
        <div className="text-sm text-slate-500">Total balance</div>
        <div className="mt-1 text-3xl font-semibold text-graphite">
          ${treasury.total.toLocaleString("en-US")} USDC
        </div>
        <div className="mt-4 flex gap-8 text-sm">
          <div>
            <div className="text-slate-400">Available</div>
            <div className="font-semibold text-graphite">
              ${treasury.available.toLocaleString("en-US")}
            </div>
          </div>
          <div>
            <div className="text-slate-400">In escrow</div>
            <div className="font-semibold text-graphite">
              ${treasury.inEscrow.toLocaleString("en-US")}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Network Distribution
        </h3>
        <div className="space-y-3">
          {treasury.byNetwork.map((n) => (
            <div key={n.network} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{n.network}</span>
              <span className="font-medium text-graphite">
                ${n.amount.toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {treasury.recent.map((tx, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{tx.label}</span>
              <span
                className={
                  tx.direction === "in"
                    ? "font-medium text-green-600"
                    : "font-medium text-slate-700"
                }
              >
                {tx.direction === "in" ? "+" : "-"}$
                {Math.abs(tx.amount).toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
