# Architecture

```text
                         ┌──────────────────────┐
                         │        USER           │
                         │    SME / Treasury     │
                         └──────────┬────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   TradePilot Web      │
                         │  (Next.js dashboard)  │
                         └──────────┬────────────┘
                                    │ REST
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ┌──────────┐   ┌──────────┐   ┌──────────────┐
              │ AI Agent │   │ Trade API│   │ Treasury API │
              │ (routes) │   │ (routes) │   │  (routes)    │
              └────┬─────┘   └────┬─────┘   └──────┬───────┘
                   │              │                │
                   └──────────────┼────────────────┘
                                  ▼
                         ┌──────────────────┐
                         │   PostgreSQL     │
                         │ (Prisma models)  │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │      Circle       │        │       Arc         │
          │ Developer-        │        │  TradePilotEscrow  │
          │ Controlled Wallets│───────▶│  USDC settlement    │
          └──────────────────┘        └──────────────────┘
                                                  │
                                                  ▼
                                        ┌──────────────────┐
                                        │     Supplier      │
                                        └──────────────────┘
```

## Trust boundary (why the AI agent can't move funds directly)

```text
AI Agent  --proposes-->  AgentAction (PENDING_APPROVAL)
                                │
                        human approves
                                │
                                ▼
                     Trade / Milestone endpoint
                                │
                                ▼
                  Circle developer-controlled wallet
                        signs & broadcasts
                                │
                                ▼
                         Arc: TradePilotEscrow
```

The AI agent only ever writes an `AgentAction` row with
`status = PENDING_APPROVAL`. No code path lets the agent call
`transferUsdc` or the escrow contract directly — a human (or, later, a
policy engine with spending limits) must flip the action to `APPROVED`
before the trade/milestone release endpoint executes anything on Circle
or Arc. This mirrors Circle's own guidance for AI-agent wallets: agents
authorize; policy-gated backends execute.

## Data flow: one milestone release

1. Buyer confirms shipment in the UI → `POST /trades/:id/milestones/:id/release`.
2. API checks the milestone is `IN_ESCROW` (not already released).
3. API calls `transferUsdc` against the company's Circle developer-controlled
   wallet, which signs and submits the transfer to Arc.
4. API updates the milestone to `RELEASED`, increments `Trade.releasedAmount`,
   and — if that was the last milestone — marks the trade `COMPLETED` and
   writes a `CreditEvent` used by the Credit Passport.
5. Frontend re-fetches the trade and reflects the new state.

Onchain, the same milestone is tracked independently inside
`TradePilotEscrow.sol` (`confirmMilestone` → `releaseMilestone`), so the
Postgres state and onchain state can be reconciled by listening to the
contract's events (`MilestoneConfirmed`, `PaymentReleased`, `TradeCompleted`).
