import {
  getDemoCompany,
  listTrades,
  getTrade as apiGetTrade,
  getTreasury,
  getCreditPassport,
  type ApiTrade,
} from "./api";
import {
  trades as mockTrades,
  treasury as mockTreasury,
  creditPassport as mockCreditPassport,
  type Trade,
  type MilestoneStatus,
} from "./mock-data";

const API_STATUS_MAP: Record<string, MilestoneStatus> = {
  PENDING: "pending",
  IN_ESCROW: "in_escrow",
  CONFIRMED: "confirmed",
  RELEASED: "released",
};

function mapApiTrade(apiTrade: ApiTrade): Trade {
  return {
    id: apiTrade.id,
    invoiceNumber: apiTrade.invoice?.invoiceNumber ?? apiTrade.invoiceId,
    supplier: apiTrade.supplierName,
    totalAmount: Number(apiTrade.totalAmount),
    releasedAmount: Number(apiTrade.releasedAmount),
    status: apiTrade.status,
    contractAddress: apiTrade.contractAddress ?? "Not yet funded",
    network: "Arc Testnet",
    milestones: apiTrade.milestones.map((m) => ({
      id: m.id,
      label: m.label,
      amount: Number(m.amount),
      share: m.sharePercent,
      status: API_STATUS_MAP[m.status] ?? "pending",
    })),
  };
}

/**
 * Live-first, mock-fallback data layer. While Postgres/Circle/Arc credentials
 * are being provisioned, every page still renders using the seed-shaped mock
 * data in `lib/mock-data.ts` — once the API is reachable and seeded, real
 * data takes over automatically with no code changes here.
 */
export async function getCompanyId(): Promise<string | null> {
  try {
    const company = await getDemoCompany();
    return company.id;
  } catch {
    return null;
  }
}

export async function getTradesData(): Promise<Trade[]> {
  const companyId = await getCompanyId();
  if (!companyId) return mockTrades;

  try {
    const apiTrades = await listTrades(companyId);
    if (apiTrades.length === 0) return mockTrades;
    return apiTrades.map(mapApiTrade);
  } catch {
    return mockTrades;
  }
}

export async function getTradeData(id: string): Promise<Trade | undefined> {
  try {
    const apiTrade = await apiGetTrade(id);
    return mapApiTrade(apiTrade);
  } catch {
    return mockTrades.find((t) => t.id === id);
  }
}

export async function getTreasuryData() {
  const companyId = await getCompanyId();
  if (!companyId) return mockTreasury;

  try {
    const live = await getTreasury(companyId);
    return {
      total: live.total,
      available: live.available,
      inEscrow: live.inEscrow,
      byNetwork: Object.entries(live.byNetwork).map(([network, amount]) => ({
        network,
        amount,
      })),
      recent: mockTreasury.recent,
    };
  } catch {
    return mockTreasury;
  }
}

export async function getCreditPassportData() {
  const companyId = await getCompanyId();
  if (!companyId) return mockCreditPassport;

  try {
    const live = await getCreditPassport(companyId);
    return {
      company: mockCreditPassport.company,
      totalVolume: live.totalVolume,
      completedTrades: live.completedTrades,
      onTimeRate: live.onTimeRate,
      avgSettlementSeconds: mockCreditPassport.avgSettlementSeconds,
      disputes: live.disputes,
      potentialFacility: live.potentialFacility,
      history: live.history.length
        ? live.history.map((h) => ({
            invoiceNumber: h.tradeId,
            amount: h.amount,
            status: h.status,
          }))
        : mockCreditPassport.history,
    };
  } catch {
    return mockCreditPassport;
  }
}
