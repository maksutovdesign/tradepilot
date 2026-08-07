export const ARC_TESTNET = {
  chainId: Number(process.env.ARC_CHAIN_ID ?? 0),
  rpcUrl: process.env.ARC_RPC_URL ?? "",
  name: "Arc Testnet",
};

export const CONTRACTS = {
  usdc: process.env.USDC_ADDRESS ?? "",
  escrow: process.env.ESCROW_ADDRESS ?? "",
};

export const MILESTONE_SPLIT = {
  order: 30,
  shipment: 40,
  delivery: 30,
} as const;
