// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {TradePilotEscrow} from "../src/TradePilotEscrow.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

contract TradePilotEscrowTest is Test {
    TradePilotEscrow escrow;
    MockUSDC usdc;

    address buyer = makeAddr("buyer");
    address supplier = makeAddr("supplier");
    address arbiter = makeAddr("arbiter");

    bytes32 constant ORDER_CONFIRMED = keccak256("ORDER_CONFIRMED");
    bytes32 constant SHIPMENT_CONFIRMED = keccak256("SHIPMENT_CONFIRMED");
    bytes32 constant DELIVERY_CONFIRMED = keccak256("DELIVERY_CONFIRMED");

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new TradePilotEscrow(address(usdc), arbiter);

        usdc.mint(buyer, 100_000e6);
        vm.prank(buyer);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _createStandardTrade() internal returns (uint256 tradeId) {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 30_000e6;
        amounts[1] = 40_000e6;
        amounts[2] = 30_000e6;

        bytes32[] memory conditions = new bytes32[](3);
        conditions[0] = ORDER_CONFIRMED;
        conditions[1] = SHIPMENT_CONFIRMED;
        conditions[2] = DELIVERY_CONFIRMED;

        vm.prank(buyer);
        tradeId = escrow.createTrade(supplier, amounts, conditions);
    }

    function test_createTrade_setsTotalAmount() public {
        uint256 tradeId = _createStandardTrade();
        (, , uint256 totalAmount, , , , , , ) = escrow.trades(tradeId);
        assertEq(totalAmount, 100_000e6);
    }

    function test_fundTrade_transfersUsdcIntoEscrow() public {
        uint256 tradeId = _createStandardTrade();

        vm.prank(buyer);
        escrow.fundTrade(tradeId);

        assertEq(usdc.balanceOf(address(escrow)), 100_000e6);
        assertEq(usdc.balanceOf(buyer), 0);
    }

    function test_milestoneFlow_releasesInOrder() public {
        uint256 tradeId = _createStandardTrade();

        vm.prank(buyer);
        escrow.fundTrade(tradeId);

        vm.prank(buyer);
        escrow.confirmMilestone(tradeId, 0);
        vm.prank(buyer);
        escrow.releaseMilestone(tradeId, 0);
        assertEq(usdc.balanceOf(supplier), 30_000e6);

        vm.prank(buyer);
        escrow.confirmMilestone(tradeId, 1);
        vm.prank(buyer);
        escrow.releaseMilestone(tradeId, 1);
        assertEq(usdc.balanceOf(supplier), 70_000e6);

        vm.prank(buyer);
        escrow.confirmMilestone(tradeId, 2);
        vm.prank(buyer);
        escrow.releaseMilestone(tradeId, 2);
        assertEq(usdc.balanceOf(supplier), 100_000e6);

        (, , , uint256 releasedAmount, , , , bool completed, ) = escrow.trades(tradeId);
        assertEq(releasedAmount, 100_000e6);
        assertTrue(completed);
    }

    function test_releaseMilestone_revertsIfNotCompleted() public {
        uint256 tradeId = _createStandardTrade();
        vm.prank(buyer);
        escrow.fundTrade(tradeId);

        vm.prank(buyer);
        vm.expectRevert(TradePilotEscrow.MilestoneNotCompleted.selector);
        escrow.releaseMilestone(tradeId, 0);
    }

    function test_disputeAndResolveToSupplier() public {
        uint256 tradeId = _createStandardTrade();
        vm.prank(buyer);
        escrow.fundTrade(tradeId);

        vm.prank(supplier);
        escrow.raiseDispute(tradeId);

        vm.prank(arbiter);
        escrow.resolveDispute(tradeId, true);

        assertEq(usdc.balanceOf(supplier), 100_000e6);
    }

    function test_disputeAndRefundToBuyer() public {
        uint256 tradeId = _createStandardTrade();
        vm.prank(buyer);
        escrow.fundTrade(tradeId);

        vm.prank(buyer);
        escrow.raiseDispute(tradeId);

        vm.prank(arbiter);
        escrow.resolveDispute(tradeId, false);

        vm.prank(buyer);
        escrow.refund(tradeId);

        assertEq(usdc.balanceOf(buyer), 100_000e6);
    }

    function test_onlyBuyer_canFundTrade() public {
        uint256 tradeId = _createStandardTrade();
        vm.prank(supplier);
        vm.expectRevert(TradePilotEscrow.NotBuyer.selector);
        escrow.fundTrade(tradeId);
    }
}
