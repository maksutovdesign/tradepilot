# Circle integration

## Products used

| Product | Where | Why |
| --- | --- | --- |
| **USDC** | `TradePilotEscrow.sol`, all transfers | The settlement currency for every milestone |
| **Developer-Controlled Wallets** | `apps/api/src/integrations/circle/client.ts` | Company treasury + supplier payout wallets, without exposing private keys to non-crypto-native SME users |
| **Arc** | `packages/contracts`, `apps/api/src/integrations/arc/client.ts` | Settlement layer: predictable USDC fees, fast finality for milestone releases |

Gateway and CCTP are documented as a stretch integration (treasury routing /
cross-chain settlement) but are not required for the core vertical slice —
see `docs/architecture.md` for what is and isn't in the MVP scope.

## How entity-secret signing works here

Every developer-controlled wallet call that touches signing needs a fresh
`entitySecretCiphertext`: Circle's public key encrypts our entity secret
(RSA-OAEP/SHA-256) per request, so the plaintext secret never leaves our
backend and never gets logged or replayed. See
`apps/api/src/integrations/circle/entitySecret.ts`.

## Why we chose these products

Trade finance for SMEs needs two things banks are bad at: fast, predictable
settlement, and a UX where the buyer never has to think about private keys.
Developer-controlled wallets let TradePilot hold and move USDC on the
company's behalf while a policy layer (see `docs/agent.md`) decides when a
transfer is allowed to happen. Arc's USDC-denominated fees make milestone
amounts predictable, which matters when a $30,000 shipment milestone can't
be eaten into by gas volatility.

## What worked well

- The developer-controlled wallet model maps directly onto our trust
  boundary: the AI agent proposes, a human approves, and only then does a
  wallet-level call happen. We didn't have to build our own key-custody
  layer to get that separation.
- USDC's fixed 6-decimal precision made milestone-split math
  (30/40/30) exact, with no rounding surprises across onchain and Postgres.

## What could be improved

- The entity-secret ciphertext step (fetch public key → RSA-encrypt → attach
  to every signing call) is correct but easy to get subtly wrong on a first
  integration; a small reference snippet combining it with a transfer call
  end-to-end (not split across two doc pages) would save time.
- For multi-milestone B2B flows like ours, a first-class "escrow" wallet
  policy (funds locked until N of M conditions met) would reduce how much of
  that logic we have to reimplement in our own smart contract.

## Recommendation

A reference architecture specifically for "AI agent proposes, backend
executes" flows — including where spending limits and policy checks should
live relative to the entity secret and wallet APIs — would make the
agentic-commerce pattern much faster to get right, since right now every
team building on Nanopayments/wallets seems to reinvent that boundary
independently.
