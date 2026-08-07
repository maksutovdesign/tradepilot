import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCreditPassportData } from "@/lib/data";

export default async function CreditPassportPage() {
  const creditPassport = await getCreditPassportData();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy">
          SME Credit Passport
        </h1>
        <p className="text-sm text-slate-500">{creditPassport.company}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="Verified volume" value={`$${creditPassport.totalVolume.toLocaleString("en-US")}`} />
        <Stat label="Completed trades" value={creditPassport.completedTrades} />
        <Stat label="On-time settlement" value={`${creditPassport.onTimeRate}%`} />
        <Stat label="Avg settlement" value={`${creditPassport.avgSettlementSeconds}s`} />
        <Stat label="Disputes" value={creditPassport.disputes} />
      </div>

      <Card>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Payment reliability
        </h3>
        <div className="mb-1 text-3xl font-semibold text-graphite">
          {creditPassport.onTimeRate}%
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${creditPassport.onTimeRate}%` }}
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Verified trade history
        </h3>
        <div className="space-y-3">
          {creditPassport.history.map((h) => (
            <div key={h.invoiceNumber} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{h.invoiceNumber}</span>
              <span className="font-medium text-graphite">
                ${h.amount.toLocaleString("en-US")}
              </span>
              <Badge tone="success">Paid</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Working Capital Profile
        </h3>
        <p className="mb-2 text-sm text-slate-500">
          Based on your verified trade history
        </p>
        <div className="mb-2 text-3xl font-semibold text-graphite">
          ${creditPassport.potentialFacility.toLocaleString("en-US")}
        </div>
        <p className="text-xs text-slate-400">
          This is an indicative prototype assessment, not a credit offer.
        </p>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-xl font-semibold text-graphite">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </Card>
  );
}
