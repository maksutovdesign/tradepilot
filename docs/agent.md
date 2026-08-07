# AI Agent

## What the agent does

1. Reads a raw invoice (text extracted from the uploaded PDF/image).
2. Calls OpenAI (`apps/api/src/integrations/ai/client.ts`) to extract
   supplier, amount, currency, payment terms, and a recommended milestone
   split (order / shipment / delivery), plus a risk score.
3. Writes an `AgentAction` row (`type: CREATE_ESCROW`, `status:
   PENDING_APPROVAL`) describing the proposed workflow.
4. Once the user clicks **Approve** in the drawer, the action flips to
   `APPROVED` and the corresponding trade/wallet endpoint executes it.

The same pattern applies to milestone releases: the agent notices a
milestone is eligible (e.g. "shipment confirmed"), proposes
`RELEASE_MILESTONE`, and waits for approval before the backend calls Circle.

## Trust boundary

```text
AI  ≠  Wallet
AI  ≠  Private key
AI  ≠  Unrestricted transaction signer
```

The agent has no code path to `transferUsdc` or the escrow contract. It can
only insert rows into `AgentAction` with `requiresApproval: true`. This is
deliberate: it's the difference between "AI chats about finance" and "AI
prepares a transaction a human still has to approve," which is the bar the
challenge's Agentic Economy track sets for a real agentic workflow.

## Where this goes next

- Add a policy engine that can auto-approve small, low-risk releases (e.g.
  below a per-trade spending limit) while still requiring human approval
  above it — mirroring how Circle's wallet policies scope agent spending.
- Let the supplier's own agent counter-confirm milestones (today only the
  buyer confirms), so `confirmMilestone` reflects agreement from both sides
  instead of a single party's claim.
