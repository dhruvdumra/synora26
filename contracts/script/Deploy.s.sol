// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {DynamicBadge} from "../src/DynamicBadge.sol";

/// @notice Deploys DynamicBadge and records the address in deployments/<chainId>.json.
/// @dev Local:   forge script script/Deploy.s.sol --rpc-url local --broadcast --unlocked --sender <anvil account>
///      Sepolia: forge script script/Deploy.s.sol --rpc-url sepolia --account ncrypt-admin --broadcast --verify
contract Deploy is Script {
    function run() external returns (DynamicBadge badge) {
        string memory name = vm.envOr("BADGE_NAME", string("NCrypt Pass"));
        string memory symbol = vm.envOr("BADGE_SYMBOL", string("NCPASS"));
        uint256 startBlock = block.number;

        vm.startBroadcast();
        (VmSafe.CallerMode mode, address admin,) = vm.readCallers();
        require(
            mode == VmSafe.CallerMode.RecurrentBroadcast,
            "Deploy: pass --account, --private-key or --unlocked"
        );
        badge = new DynamicBadge(name, symbol, admin);
        vm.stopBroadcast();

        vm.createDir("deployments", true);
        string memory key = "deployment";
        vm.serializeString(key, "name", name);
        vm.serializeUint(key, "chainId", block.chainid);
        vm.serializeUint(key, "startBlock", startBlock);
        vm.serializeAddress(key, "admin", admin);
        string memory json = vm.serializeAddress(key, "address", address(badge));
        vm.writeJson(json, string.concat("deployments/", vm.toString(block.chainid), ".json"));

        console.log("DynamicBadge deployed at", address(badge));
        console.log("Admin and staff:", admin);
        console.log("Start block:", startBlock);
    }
}
