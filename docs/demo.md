# Demo script (2–3 minutes)

## 0:00–0:20 — Problem
Show a real-looking international invoice. Voiceover: SME cross-border trade
still runs on trust, paperwork, and manual reconciliation between buyer and
supplier banks.

## 0:20–0:45 — Upload & AI analysis
`/invoices/new` → drop the invoice → AI extracts supplier, amount, currency,
30/40/30 payment terms, risk = LOW, recommends milestone escrow.

## 0:45–1:10 — Approve workflow
Open the AI Agent drawer → show the proposed milestone split → click
**Approve workflow**. Cut to the trade being created (`/trades/inv-2048`).

## 1:10–1:30 — Fund escrow onchain
Show the "Onchain Status" card: network = Arc Testnet, contract address,
escrow funded. (If recording against a live testnet deploy, show the tx
confirmation; otherwise narrate over the UI state.)

## 1:30–1:50 — Milestone release
Click **Release payment** on the eligible milestone → USDC amount updates →
Payment Flow card shows the milestone flip from "in escrow" to "released."

## 1:50–2:10 — Credit Passport updates
Navigate to `/credit-passport` → verified volume, completed trades, and
on-time rate reflect the new trade → "Working Capital Profile" shows an
indicative facility amount.

## 2:10–2:30 — Close
One line on why this matters: programmable trust turns every completed
trade into portable, verifiable credit history for an SME that otherwise
has none.

## Proof: live onchain cycle already run on Arc Testnet

Contract: [`0xc46673b16c94d2898c59aeaa0fd588f2af13792f`](https://testnet.arcscan.app/address/0xc46673b16c94d2898c59aeaa0fd588f2af13792f)

| Step | Tx |
| --- | --- |
| Create Trade (5 USDC, 2 milestones) | [`0xd695...16535`](https://testnet.arcscan.app/tx/0xd695838e400da8f8121dfa684174fa0e84487d82652a806089462a5310e16535) |
| Approve USDC | [`0x014f...03576`](https://testnet.arcscan.app/tx/0x014f4fe050f14e9de55419757db9ba3133502ca025f8ec6f2191957949403576) |
| Fund Trade | [`0xf0d6...c8701`](https://testnet.arcscan.app/tx/0xf0d691f895bc6a250d40850eac83182491e875c08b6af514e656a63eee4c8701) |
| Confirm + Release Shipment (2 USDC) | [`0x8023...31a723`](https://testnet.arcscan.app/tx/0x802358f3586a376ba7741657be868922c15b2eccedfe6b551514b0144231a723) |
| Confirm + Release Delivery (3 USDC) → `TradeCompleted` | [`0x13b5...0af1a26`](https://testnet.arcscan.app/tx/0x13b59091db3ed17c27f9d84a3dbf64e9eeabc0be2794fb5e2ee126a930af1a26) |

Any of these can be opened live on [testnet.arcscan.app](https://testnet.arcscan.app) during the "Fund escrow onchain" / "Milestone release" beats instead of narrating over static UI.

## Recording checklist

- [ ] Seed data loaded (`pnpm --filter @tradepilot/api seed`)
- [ ] Escrow contract deployed to Arc Testnet, address in `.env`
- [ ] At least one real testnet USDC transfer recorded for the "onchain"
      beat, even if the rest of the walkthrough uses seeded UI state
- [ ] Screen resolution ≥ 1440px wide so card text is legible
