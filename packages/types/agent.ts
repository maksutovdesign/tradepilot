export type AgentActionType =
  | "CREATE_ESCROW"
  | "CONFIRM_MILESTONE"
  | "RELEASE_MILESTONE"
  | "RAISE_DISPUTE";

export type AgentActionStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "FAILED";

export interface AgentAction {
  id: string;
  tradeId: string;
  type: AgentActionType;
  description: string;
  amount?: string;
  status: AgentActionStatus;
  requiresApproval: boolean;
  transactionHash?: string;
  createdAt: string;
}
