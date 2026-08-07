export type WalletAccountType = "EOA" | "SCA";

export interface Wallet {
  id: string;
  companyId: string;
  circleWalletId: string;
  address: string;
  accountType: WalletAccountType;
  blockchain: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  tradeId?: string;
  walletId: string;
  amount: string;
  direction: "in" | "out";
  txHash?: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  createdAt: string;
}
