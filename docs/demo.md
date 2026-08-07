# Demo video script (~2:30–2:45)

Record against the live app — no local setup, no fallback/mock state needed:
**https://web-psi-rose-15.vercel.app**

Everything below happens against the real Postgres database, a real Circle
developer-controlled wallet, and the escrow contract deployed on Arc Testnet.
Narrate in first person, confident and plain — this is a working product, not
a concept pitch.

---

## 0:00–0:15 — Problem (voiceover over a static invoice image or the Dashboard)

> "International SME trade still runs on trust and paperwork. A buyer pays
> before delivery and hopes, or a supplier ships before payment and hopes.
> There's no shared, verifiable record of who actually pays on time."

## 0:15–0:25 — One-line pitch

> "TradePilot turns an invoice into a programmable USDC escrow on Arc — funds
> release automatically as delivery milestones are confirmed, and every
> completed trade builds a verifiable credit history for the SME."

Show: Dashboard at `/dashboard` — point at the AI Actions card and Active
Trades list for 2 seconds, just to establish "this is a real running app."

## 0:25–1:00 — AI Agent creates a trade from an invoice

1. Click **AI Agent** (top right).
2. Point out the textarea already has a sample invoice (or type your own —
   keep it short: supplier, amount, payment terms).
3. Click **Analyze request**.
   > "The agent reads the invoice and proposes a milestone escrow — 30% on
   > order, 40% on shipment, 30% on delivery."
4. Once the proposal card shows the real extracted supplier/amount/terms,
   click **Approve workflow**.
   > "I approve it — the agent never moves money itself, it only proposes.
   > This click is what actually creates the trade."
5. Land on the new trade's detail page (`/trades/<id>`), status
   `AWAITING_FUNDING`.

## 1:00–1:15 — Fund the escrow onchain

1. Click **Fund escrow** in the TradePilot Agent card.
   > "This calls fundTrade on our TradePilotEscrow contract, deployed live on
   > Arc Testnet."
2. Status flips to `IN_PROGRESS`, first milestone (Order) shows **In escrow**.

*(Optional cutaway, ~3s): switch to a second tab already open on
[testnet.arcscan.app](https://testnet.arcscan.app/address/0xc46673b16c94d2898c59aeaa0fd588f2af13792f)
showing the contract's real transaction history.)*

## 1:15–1:50 — Confirm → Release, twice

1. Click **Confirm order** → milestone flips to **Confirmed**, agent card
   updates to "eligible for release."
   > "Confirm mirrors the contract's confirmMilestone step — proof the
   > condition was met."
2. Click **Release payment** → USDC amount moves, Payment Flow card shows
   the milestone flip to **Released** (✓), next milestone (Shipment)
   automatically becomes **In escrow**.
3. Repeat once more for Shipment (confirm → release) to show the pattern
   is consistent, then cut — no need to run all three on camera.

> "Confirm and release are two separate steps on purpose — it mirrors the
> actual smart contract, and it means a human always confirms delivery
> before money moves."

## 1:50–2:10 — Credit Passport updates

Navigate to `/credit-passport`.
> "Every completed trade — like the $100k one already settled here — feeds a
> verifiable payment history. That's the thing an SME can actually take to a
> lender: not a guess, a record."

Point at: verified volume, completed trades, on-time rate, and the
"Working Capital Profile" indicative facility figure.

## 2:10–2:35 — How it's built (Circle + Arc)

Show the architecture diagram (`docs/diagrams/system-architecture.svg`) for
~10 seconds while narrating:

> "The web app talks to an Express API. The API holds trade state in
> Postgres, asks Circle's developer-controlled wallet to sign the USDC
> transfer, and reads trade state directly from our escrow contract on Arc.
> The AI agent only ever writes a pending-approval row — it has no code path
> to sign a transaction itself." *(flash the trust-boundary diagram, ~5s)*

## 2:35–2:45 — Close

> "That's TradePilot — an AI agent that proposes, a smart contract that
> enforces, and a payment history an SME can actually build credit on. Built
> on Arc, settled in USDC, with Circle wallets underneath."

---

## What to have open before recording

- [ ] Live app in the main window: https://web-psi-rose-15.vercel.app
- [ ] (Optional) a second tab pinned to
      [the escrow contract on Arc explorer](https://testnet.arcscan.app/address/0xc46673b16c94d2898c59aeaa0fd588f2af13792f)
      for a quick onchain cutaway
- [ ] `docs/diagrams/system-architecture.svg` and
      `docs/diagrams/agent-trust-boundary.svg` open (or exported as PNG) for
      the architecture beat
- [ ] Browser window ≥ 1440px wide, zoom at 100%, cursor visible
- [ ] A quiet mic take — script above is ~230 words, reads in ~90–100s at a
      calm pace; the remaining time is UI action with brief narration

## Already-proven live onchain cycle (backup footage / talking point)

If a live click-through ever misbehaves during recording, this exact cycle
was already run successfully on Arc Testnet and can be shown via the
block explorer instead:

Contract: [`0xc46673b16c94d2898c59aeaa0fd588f2af13792f`](https://testnet.arcscan.app/address/0xc46673b16c94d2898c59aeaa0fd588f2af13792f)

| Step | Tx |
| --- | --- |
| Create Trade (5 USDC, 2 milestones) | [`0xd695...16535`](https://testnet.arcscan.app/tx/0xd695838e400da8f8121dfa684174fa0e84487d82652a806089462a5310e16535) |
| Approve USDC | [`0x014f...03576`](https://testnet.arcscan.app/tx/0x014f4fe050f14e9de55419757db9ba3133502ca025f8ec6f2191957949403576) |
| Fund Trade | [`0xf0d6...c8701`](https://testnet.arcscan.app/tx/0xf0d691f895bc6a250d40850eac83182491e875c08b6af514e656a63eee4c8701) |
| Confirm + Release Shipment (2 USDC) | [`0x8023...31a723`](https://testnet.arcscan.app/tx/0x802358f3586a376ba7741657be868922c15b2eccedfe6b551514b0144231a723) |
| Confirm + Release Delivery (3 USDC) → `TradeCompleted` | [`0x13b5...0af1a26`](https://testnet.arcscan.app/tx/0x13b59091db3ed17c27f9d84a3dbf64e9eeabc0be2794fb5e2ee126a930af1a26) |

## Recording checklist

- [ ] Confirm the live app shows real (non-fallback) data before recording —
      reload `/dashboard` once and check numbers aren't the seeded
      "$382,400 / 38 trades" mock values
- [ ] Do one full dry run of AI Agent → Fund → Confirm → Release before
      recording, so the timing above is a guide, not a guess
- [ ] Screen resolution ≥ 1440px wide so card text is legible
- [ ] Upload to YouTube (unlisted is fine) or Loom — the submission form
      needs a direct link, not an attached file
