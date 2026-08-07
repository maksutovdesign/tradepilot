// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {TradePilotEscrow} from "../src/TradePilotEscrow.sol";

/// @dev Deploys TradePilotEscrow to Arc Testnet.
/// Requires env vars: PRIVATE_KEY, USDC_ADDRESS, ARBITER_ADDRESS (optional,
/// defaults to the deployer).
///
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url $ARC_RPC_URL \
///     --broadcast
contract Deploy is Script {
    function run() external returns (TradePilotEscrow escrow) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        address arbiter = vm.envOr("ARBITER_ADDRESS", vm.addr(deployerKey));

        vm.startBroadcast(deployerKey);
        escrow = new TradePilotEscrow(usdcAddress, arbiter);
        vm.stopBroadcast();

        console.log("TradePilotEscrow deployed at:", address(escrow));
    }
}
