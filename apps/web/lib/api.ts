const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Hackathon-scope: no real session layer yet, so every server component
// resolves the same demo company via a fixed login email. Swap this for a
// real auth cookie once /login is wired to actual sessions.
const DEMO_EMAIL = "ops@dubaitrading.example";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface ApiUser {
  id: string;
  email: string;
  companyId: string;
  company: { id: string; name: string };
}

export async function getDemoCompany() {
  const { user } = await apiFetch<{ user: ApiUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: DEMO_EMAIL }),
  });
  return user.company;
}

export interface ApiMilestone {
  id: string;
  tradeId: string;
  label: string;
  amount: string;
  sharePercent: number;
  condition: string;
  status: "PENDING" | "IN_ESCROW" | "CONFIRMED" | "RELEASED";
  releasedAt: string | null;
}

export interface ApiTrade {
  id: string;
  invoiceId: string;
  invoice?: { invoiceNumber: string };
  buyerId: string;
  supplierName: string;
  contractAddress: string | null;
  onchainTradeId: string | null;
  totalAmount: string;
  releasedAmount: string;
  status: string;
  milestones: ApiMilestone[];
  createdAt: string;
  completedAt: string | null;
}

export async function listTrades(buyerId: string) {
  const { trades } = await apiFetch<{ trades: ApiTrade[] }>(
    `/trades?buyerId=${buyerId}`
  );
  return trades;
}

export async function getTrade(id: string) {
  const { trade } = await apiFetch<{ trade: ApiTrade }>(`/trades/${id}`);
  return trade;
}

export async function fundTrade(tradeId: string) {
  const { trade } = await apiFetch<{ trade: ApiTrade }>(`/trades/${tradeId}/fund`, {
    method: "POST",
    body: JSON.stringify({ contractAddress: "0xc46673b16c94d2898c59aeaa0fd588f2af13792f" }),
  });
  return trade;
}

export async function confirmMilestone(tradeId: string, milestoneId: string) {
  return apiFetch<{ milestone: ApiMilestone }>(
    `/trades/${tradeId}/milestones/${milestoneId}/confirm`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function releaseMilestone(tradeId: string, milestoneId: string) {
  return apiFetch<{ milestone: ApiMilestone; txHash?: string }>(
    `/trades/${tradeId}/milestones/${milestoneId}/release`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export interface ApiTreasury {
  total: number;
  available: number;
  inEscrow: number;
  byNetwork: Record<string, number>;
}

export async function getTreasury(companyId: string) {
  return apiFetch<ApiTreasury>(`/treasury/${companyId}`);
}

export interface ApiCreditPassport {
  totalVolume: number;
  completedTrades: number;
  onTimeRate: number;
  disputes: number;
  potentialFacility: number;
  history: Array<{ tradeId: string; amount: number; status: string }>;
}

export async function getCreditPassport(companyId: string) {
  return apiFetch<ApiCreditPassport>(`/credit-passport/${companyId}`);
}

export interface InvoiceExtractionResult {
  invoice: {
    id: string;
    supplierName: string;
    amount: string;
    currency: string;
    paymentTerms: string;
    aiRiskScore: string | null;
  };
  extraction?: {
    milestoneSplit: { label: string; sharePercent: number }[];
  };
  warning?: string;
}

export async function createInvoice(params: {
  companyId: string;
  invoiceNumber: string;
  rawText: string;
}) {
  return apiFetch<InvoiceExtractionResult>("/invoices", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createTrade(params: { invoiceId: string; buyerId: string }) {
  const { trade } = await apiFetch<{ trade: ApiTrade }>("/trades", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return trade;
}
