export type MilestoneStatus = "pending" | "in_escrow" | "released";

export interface Milestone {
  id: string;
  tradeId: string;
  label: string;
  amount: string;
  sharePercent: number;
  condition: string;
  status: MilestoneStatus;
  releasedAt?: string;
}

export type TradeStatus =
  | "DRAFT"
  | "AWAITING_FUNDING"
  | "FUNDED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED";

export interface Trade {
  id: string;
  invoiceId: string;
  buyerId: string;
  supplierId: string;
  contractAddress?: string;
  onchainTradeId?: string;
  totalAmount: string;
  releasedAmount: string;
  status: TradeStatus;
  milestones: Milestone[];
  createdAt: string;
  completedAt?: string;
}
