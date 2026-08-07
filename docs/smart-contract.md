# TradePilotEscrow.sol

Location: `packages/contracts/src/TradePilotEscrow.sol`

## Model

```solidity
struct Trade {
    address buyer;
    address supplier;
    uint256 totalAmount;
    uint256 releasedAmount;
    uint8 currentMilestone;
    bool funded;
    bool disputed;
    bool completed;
    bool refunded;
}

struct Milestone {
    uint256 amount;
    bytes32 condition;   // e.g. keccak256("SHIPMENT_CONFIRMED")
    bool completed;
    bool released;
}
```

## State machine

```text
CREATED → FUNDED → (per milestone) CONFIRMED → RELEASED → ... → COMPLETED
                 └─ DISPUTED → resolveDispute(true)  → remaining → supplier
                             → resolveDispute(false) → refund() → buyer
```

## Functions

| Function | Caller | Effect |
| --- | --- | --- |
| `createTrade(supplier, amounts[], conditions[])` | buyer | Registers a trade + milestone plan, no funds move |
| `fundTrade(tradeId)` | buyer | Pulls `totalAmount` USDC into the contract via `safeTransferFrom` |
| `confirmMilestone(tradeId, milestoneId)` | buyer | Marks a milestone condition as met |
| `releaseMilestone(tradeId, milestoneId)` | buyer or supplier | Pays out that milestone's USDC to the supplier |
| `raiseDispute(tradeId)` | buyer or supplier | Freezes further releases |
| `resolveDispute(tradeId, releaseToSupplier)` | arbiter | Pays remaining balance to supplier, or clears the dispute so the buyer can refund |
| `refund(tradeId)` | buyer | Returns the remaining escrowed balance after a dispute resolved in the buyer's favor |

## Design choices

- **One escrow contract, many trades.** `nextTradeId` is a simple counter;
  trades and their milestones live in mappings. This keeps deployment to a
  single address per environment instead of one contract per trade.
- **`bytes32` conditions, not onchain oracles.** For the hackathon MVP,
  milestone conditions are confirmed by the buyer (a stand-in for
  proof-of-delivery integrations). The condition label is still recorded
  onchain so a future version can gate `confirmMilestone` behind a real
  oracle or the supplier's counter-signature without changing the struct.
- **`SafeERC20` + `ReentrancyGuard`** from OpenZeppelin on every function
  that moves USDC.
- **No custom token, no DAO, no lending logic.** Scope was deliberately kept
  to "one escrow contract that works," per the challenge's guidance that a
  working vertical slice beats a wide, half-finished surface area.

## Tests

`packages/contracts/test/TradePilotEscrow.t.sol` — 7 tests covering trade
creation, funding, sequential milestone release, revert-on-unconfirmed
release, dispute → resolve-to-supplier, dispute → resolve-to-buyer → refund,
and the buyer-only guard on `fundTrade`. Run with:

```bash
cd packages/contracts
forge test -vv
```

## Deployment

```bash
cd packages/contracts
forge script script/Deploy.s.sol:Deploy --rpc-url $ARC_RPC_URL --broadcast
```

Requires `PRIVATE_KEY` and `USDC_ADDRESS` (Arc Testnet USDC) as environment
variables; `ARBITER_ADDRESS` defaults to the deployer if unset.
