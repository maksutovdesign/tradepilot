import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getTradesData, getTreasuryData, getCreditPassportData } from "@/lib/data";

export default async function DashboardPage() {
  const [trades, treasury, creditPassport] = await Promise.all([
    getTradesData(),
    getTreasuryData(),
    getCreditPassportData(),
  ]);
  const activeTrade = trades[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy">
          Good afternoon, {creditPassport.company}
        </h1>
        <p className="text-sm text-slate-500">
          Your trade finance operations are under control.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-slate-500">Available USDC</div>
          <div className="mt-1 text-2xl font-semibold text-graphite">
            ${treasury.available.toLocaleString("en-US")}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Trades</div>
          <div className="mt-1 text-2xl font-semibold text-graphite">
            {creditPassport.completedTrades}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Reliability</div>
          <div className="mt-1 text-2xl font-semibold text-graphite">
            {creditPassport.onTimeRate}%
          </div>
        </Card>
      </div>

      {activeTrade && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            AI Actions
          </h2>
          <Card className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-navy">
                {activeTrade.invoiceNumber} · ${activeTrade.totalAmount.toLocaleString("en-US")}
              </div>
              <div className="text-sm text-slate-500">{activeTrade.supplier}</div>
              <div className="mt-1 text-xs text-slate-400">
                Milestone escrow recommended
              </div>
            </div>
            <Link
              href={`/trades/${activeTrade.id}`}
              className="text-sm font-medium text-accent"
            >
              Review →
            </Link>
          </Card>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Active Trades
        </h2>
        <div className="space-y-3">
          {trades.map((trade) => (
            <Link key={trade.id} href={`/trades/${trade.id}`}>
              <Card className="hover:border-accent/40">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-navy">
                    {trade.supplier}
                  </div>
                  <div className="text-sm font-semibold text-graphite">
                    ${trade.totalAmount.toLocaleString("en-US")}
                  </div>
                </div>
                <Progress
                  value={(trade.releasedAmount / trade.totalAmount) * 100}
                />
                <div className="mt-2 text-xs text-slate-500">{trade.status}</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
