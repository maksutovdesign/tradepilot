// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TradePilotEscrow
/// @notice Milestone-based USDC escrow for SME trade finance. A buyer funds a
/// trade once; USDC unlocks to the supplier as each milestone condition
/// (order / shipment / delivery, or any custom split) is confirmed.
contract TradePilotEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Milestone {
        uint256 amount;
        bytes32 condition;
        bool completed;
        bool released;
    }

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

    IERC20 public immutable usdc;
    address public immutable arbiter;

    uint256 public nextTradeId;
    mapping(uint256 => Trade) public trades;
    mapping(uint256 => Milestone[]) public tradeMilestones;

    event TradeCreated(uint256 indexed tradeId, address indexed buyer, address indexed supplier, uint256 totalAmount);
    event TradeFunded(uint256 indexed tradeId, uint256 amount);
    event MilestoneConfirmed(uint256 indexed tradeId, uint256 indexed milestoneId);
    event PaymentReleased(uint256 indexed tradeId, uint256 indexed milestoneId, uint256 amount, address supplier);
    event TradeCompleted(uint256 indexed tradeId);
    event DisputeRaised(uint256 indexed tradeId, address raisedBy);
    event DisputeResolved(uint256 indexed tradeId, bool releasedToSupplier);
    event TradeRefunded(uint256 indexed tradeId, uint256 amount);

    error NotBuyer();
    error NotSupplier();
    error NotBuyerOrSupplier();
    error NotArbiter();
    error TradeAlreadyFunded();
    error TradeNotFunded();
    error InvalidMilestones();
    error MilestoneNotCompleted();
    error MilestoneAlreadyReleased();
    error TradeIsDisputed();
    error TradeNotDisputed();
    error TradeAlreadyCompleted();

    modifier onlyBuyer(uint256 tradeId) {
        if (msg.sender != trades[tradeId].buyer) revert NotBuyer();
        _;
    }

    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert NotArbiter();
        _;
    }

    constructor(address usdcAddress, address arbiterAddress) {
        usdc = IERC20(usdcAddress);
        arbiter = arbiterAddress;
    }

    /// @notice Creates a trade with a milestone payment plan. Amounts must sum
    /// to the trade total; conditions are opaque labels (e.g. keccak256("SHIPMENT_CONFIRMED"))
    /// interpreted off-chain by the TradePilot backend/agent.
    function createTrade(
        address supplier,
        uint256[] calldata milestoneAmounts,
        bytes32[] calldata milestoneConditions
    ) external returns (uint256 tradeId) {
        if (milestoneAmounts.length == 0 || milestoneAmounts.length != milestoneConditions.length) {
            revert InvalidMilestones();
        }

        uint256 total;
        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            total += milestoneAmounts[i];
        }

        tradeId = nextTradeId++;
        trades[tradeId] = Trade({
            buyer: msg.sender,
            supplier: supplier,
            totalAmount: total,
            releasedAmount: 0,
            currentMilestone: 0,
            funded: false,
            disputed: false,
            completed: false,
            refunded: false
        });

        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            tradeMilestones[tradeId].push(
                Milestone({amount: milestoneAmounts[i], condition: milestoneConditions[i], completed: false, released: false})
            );
        }

        emit TradeCreated(tradeId, msg.sender, supplier, total);
    }

    /// @notice Locks the full trade amount in USDC. Caller must have approved
    /// this contract for at least `totalAmount` beforehand.
    function fundTrade(uint256 tradeId) external onlyBuyer(tradeId) nonReentrant {
        Trade storage trade = trades[tradeId];
        if (trade.funded) revert TradeAlreadyFunded();

        trade.funded = true;
        usdc.safeTransferFrom(msg.sender, address(this), trade.totalAmount);

        emit TradeFunded(tradeId, trade.totalAmount);
    }

    /// @notice Marks a milestone condition as satisfied. In this MVP the
    /// buyer confirms delivery-side milestones directly; a future version can
    /// gate this behind an oracle or the supplier's counter-signature.
    function confirmMilestone(uint256 tradeId, uint256 milestoneId) external onlyBuyer(tradeId) {
        Trade storage trade = trades[tradeId];
        if (!trade.funded) revert TradeNotFunded();
        if (trade.disputed) revert TradeIsDisputed();

        tradeMilestones[tradeId][milestoneId].completed = true;
        emit MilestoneConfirmed(tradeId, milestoneId);
    }

    /// @notice Releases USDC for a confirmed milestone to the supplier.
    function releaseMilestone(uint256 tradeId, uint256 milestoneId) external nonReentrant {
        Trade storage trade = trades[tradeId];
        if (msg.sender != trade.buyer && msg.sender != trade.supplier) revert NotBuyerOrSupplier();
        if (!trade.funded) revert TradeNotFunded();
        if (trade.disputed) revert TradeIsDisputed();

        Milestone storage milestone = tradeMilestones[tradeId][milestoneId];
        if (!milestone.completed) revert MilestoneNotCompleted();
        if (milestone.released) revert MilestoneAlreadyReleased();

        milestone.released = true;
        trade.releasedAmount += milestone.amount;
        trade.currentMilestone += 1;

        usdc.safeTransfer(trade.supplier, milestone.amount);
        emit PaymentReleased(tradeId, milestoneId, milestone.amount, trade.supplier);

        if (trade.releasedAmount == trade.totalAmount) {
            trade.completed = true;
            emit TradeCompleted(tradeId);
        }
    }

    function raiseDispute(uint256 tradeId) external {
        Trade storage trade = trades[tradeId];
        if (msg.sender != trade.buyer && msg.sender != trade.supplier) revert NotBuyerOrSupplier();
        if (trade.completed) revert TradeAlreadyCompleted();

        trade.disputed = true;
        emit DisputeRaised(tradeId, msg.sender);
    }

    /// @notice Arbiter resolves a dispute by either releasing the remaining
    /// escrowed balance to the supplier or allowing the buyer to refund it.
    function resolveDispute(uint256 tradeId, bool releaseToSupplier) external onlyArbiter {
        Trade storage trade = trades[tradeId];
        if (!trade.disputed) revert TradeNotDisputed();

        trade.disputed = false;
        emit DisputeResolved(tradeId, releaseToSupplier);

        if (releaseToSupplier) {
            uint256 remaining = trade.totalAmount - trade.releasedAmount;
            trade.releasedAmount = trade.totalAmount;
            trade.completed = true;
            usdc.safeTransfer(trade.supplier, remaining);
            emit TradeCompleted(tradeId);
        }
    }

    /// @notice Refunds the remaining escrowed balance to the buyer. Only
    /// callable after the arbiter has resolved a dispute in the buyer's
    /// favor (i.e. disputed was cleared without releasing to the supplier).
    function refund(uint256 tradeId) external nonReentrant onlyBuyer(tradeId) {
        Trade storage trade = trades[tradeId];
        if (trade.disputed) revert TradeIsDisputed();
        if (trade.completed) revert TradeAlreadyCompleted();
        if (trade.refunded) revert TradeAlreadyCompleted();

        uint256 remaining = trade.totalAmount - trade.releasedAmount;
        trade.refunded = true;
        usdc.safeTransfer(trade.buyer, remaining);

        emit TradeRefunded(tradeId, remaining);
    }

    function getMilestones(uint256 tradeId) external view returns (Milestone[] memory) {
        return tradeMilestones[tradeId];
    }
}
