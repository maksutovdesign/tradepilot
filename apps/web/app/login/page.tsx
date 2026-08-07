import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-1 text-lg font-semibold text-navy">TradePilot</div>
          <p className="text-sm text-slate-500">
            Autonomous trade finance for SMEs
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Work email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <Link href="/dashboard">
            <Button className="w-full">Sign in</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
