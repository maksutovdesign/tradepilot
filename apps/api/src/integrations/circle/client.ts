import { randomUUID } from "node:crypto";
import { getEntitySecretCiphertext } from "./entitySecret";

const CIRCLE_API_BASE = "https://api.circle.com/v1/w3s";

function getApiKey() {
  const key = process.env.CIRCLE_API_KEY;
  if (!key) throw new Error("CIRCLE_API_KEY is not set");
  return key;
}

function getEntitySecret() {
  const secret = process.env.CIRCLE_ENTITY_SECRET;
  if (!secret) throw new Error("CIRCLE_ENTITY_SECRET is not set");
  return secret;
}

async function circleRequest<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${CIRCLE_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Circle API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export interface CircleWallet {
  id: string;
  address: string;
  blockchain: string;
  accountType: "EOA" | "SCA";
}

/**
 * Creates a developer-controlled wallet on Arc Testnet for a company.
 * Backend-initiated, never exposes a private key to the frontend —
 * this is the treasury/supplier wallet used for automated escrow payouts.
 */
export async function createCompanyWallet(params: {
  walletSetId: string;
  blockchain?: string;
}): Promise<CircleWallet> {
  const entitySecretCiphertext = await getEntitySecretCiphertext(
    getApiKey(),
    getEntitySecret()
  );

  const body = {
    idempotencyKey: randomUUID(),
    entitySecretCiphertext,
    walletSetId: params.walletSetId,
    blockchains: [params.blockchain ?? "ARC-TESTNET"],
    accountType: "EOA",
  };

  const res = await circleRequest<{ data: { wallets: CircleWallet[] } }>(
    "/developer/wallets",
    { method: "POST", body: JSON.stringify(body) }
  );

  return res.data.wallets[0];
}

export async function getWalletBalance(walletId: string) {
  return circleRequest<{
    data: { tokenBalances: Array<{ token: { symbol: string }; amount: string }> };
  }>(`/wallets/${walletId}/balances`, { method: "GET" });
}

/**
 * Initiates a USDC transfer from a developer-controlled wallet.
 * Used for milestone releases: the escrow contract has already validated
 * the condition — this call executes the actual payout leg.
 */
export async function transferUsdc(params: {
  walletId: string;
  destinationAddress: string;
  amount: string;
  tokenId: string;
}) {
  const entitySecretCiphertext = await getEntitySecretCiphertext(
    getApiKey(),
    getEntitySecret()
  );

  const body = {
    idempotencyKey: randomUUID(),
    entitySecretCiphertext,
    walletId: params.walletId,
    tokenId: params.tokenId,
    destinationAddress: params.destinationAddress,
    amounts: [params.amount],
    feeLevel: "MEDIUM",
  };

  return circleRequest<{ data: { id: string; state: string } }>(
    "/developer/transactions/transfer",
    { method: "POST", body: JSON.stringify(body) }
  );
}

export async function getTransactionStatus(transactionId: string) {
  return circleRequest<{ data: { transaction: { txHash?: string; state: string } } }>(
    `/transactions/${transactionId}`,
    { method: "GET" }
  );
}
