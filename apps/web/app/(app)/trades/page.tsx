import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getTradesData } from "@/lib/data";

export default async function TradesPage() {
  const trades = await getTradesData();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-navy">Trades</h1>
      </div>

      <div className="space-y-3">
        {trades.map((trade) => {
          const completed = trade.milestones.filter(
            (m) => m.status === "released"
          ).length;
          return (
            <Link key={trade.id} href={`/trades/${trade.id}`}>
              <Card className="hover:border-accent/40">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-semibold text-navy">
                    {trade.invoiceNumber}
                  </div>
                  <Badge tone={trade.status === "Completed" ? "success" : "pending"}>
                    {trade.status}
                  </Badge>
                </div>
                <div className="mb-3 text-sm text-slate-500">{trade.supplier}</div>
                <div className="mb-2 text-lg font-semibold text-graphite">
                  ${trade.totalAmount.toLocaleString("en-US")} USDC
                </div>
                <Progress
                  value={(trade.releasedAmount / trade.totalAmount) * 100}
                />
                <div className="mt-2 text-xs text-slate-500">
                  {completed} / {trade.milestones.length} milestones completed
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
