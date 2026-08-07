import { createPublicClient, http, type Address } from "viem";

const arcTestnet = {
  id: Number(process.env.ARC_CHAIN_ID ?? 0),
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: [process.env.ARC_RPC_URL ?? ""] },
  },
} as const;

export const arcClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.ARC_RPC_URL ?? ""),
});

const ESCROW_ABI = [
  {
    type: "function",
    name: "getTrade",
    stateMutability: "view",
    inputs: [{ name: "tradeId", type: "uint256" }],
    outputs: [
      { name: "buyer", type: "address" },
      { name: "supplier", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "releasedAmount", type: "uint256" },
      { name: "currentMilestone", type: "uint8" },
      { name: "completed", type: "bool" },
    ],
  },
] as const;

export async function readTradeFromEscrow(escrowAddress: Address, onchainTradeId: bigint) {
  return arcClient.readContract({
    address: escrowAddress,
    abi: ESCROW_ABI,
    functionName: "getTrade",
    args: [onchainTradeId],
  });
}

export async function waitForTransaction(hash: `0x${string}`) {
  return arcClient.waitForTransactionReceipt({ hash });
}
