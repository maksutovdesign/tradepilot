import { publicEncrypt, constants } from "node:crypto";

const CIRCLE_API_BASE = "https://api.circle.com/v1/w3s";

let cachedPublicKey: string | null = null;

async function fetchEntityPublicKey(apiKey: string): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;

  const res = await fetch(`${CIRCLE_API_BASE}/config/entity/publicKey`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Circle entity public key: ${res.status}`);
  }
  const body = (await res.json()) as { data: { publicKey: string } };
  cachedPublicKey = body.data.publicKey;
  return cachedPublicKey;
}

/**
 * Circle requires a fresh RSA-OAEP encrypted entity secret ciphertext on every
 * developer-controlled wallet API call that touches signing (create wallet,
 * transfer, contract execution). The plaintext entity secret never leaves
 * this process; only the ciphertext is sent to Circle.
 */
export async function getEntitySecretCiphertext(apiKey: string, entitySecretHex: string) {
  const publicKey = await fetchEntityPublicKey(apiKey);
  const entitySecretBuffer = Buffer.from(entitySecretHex, "hex");

  const encrypted = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    entitySecretBuffer
  );

  return encrypted.toString("base64");
}
