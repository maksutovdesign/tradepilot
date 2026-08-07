import Link from "next/link";
import { notFound } from "next/navigation";
import { getTradeData } from "@/lib/data";
import { TradeDetailClient } from "./trade-detail-client";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trade = await getTradeData(id);
  if (!trade) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/trades" className="text-sm text-slate-500 hover:text-slate-700">
        ← Trades
      </Link>
      <TradeDetailClient trade={trade} />
    </div>
  );
}
