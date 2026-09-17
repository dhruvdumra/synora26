// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {DynamicBadge} from "../src/DynamicBadge.sol";

/// @notice Fills a fresh deployment with sessions and demo attendees across every tier, so the
///         leaderboard and admin console have something to show before real attendees arrive.
/// @dev Run with the same signer that deployed (it needs STAFF_ROLE):
///      forge script script/SeedDemo.s.sol --rpc-url <local|sepolia> --broadcast <signer flags>
contract SeedDemo is Script {
    uint256 internal constant ATTENDEES = 8;

    function run() external {
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        DynamicBadge badge = DynamicBadge(vm.parseJsonAddress(vm.readFile(path), ".address"));

        vm.startBroadcast();

        uint256[4] memory sessions = [
            badge.createSession("Opening Keynote"),
            badge.createSession("Zero-Knowledge 101"),
            badge.createSession("Gas Golfing Workshop"),
            badge.createSession("Founders Panel")
        ];

        uint256[] memory ids = new uint256[](ATTENDEES);
        for (uint256 i; i < ATTENDEES; ++i) {
            address attendee = vm.addr(uint256(keccak256(abi.encode("ncrypt-demo-attendee", i))));
            uint256 existing = badge.tokenOf(attendee);
            ids[i] = existing != 0 ? existing : badge.mintTo(attendee);
        }

        // Session 0 has everyone, each later session loses two attendees.
        for (uint256 s; s < sessions.length; ++s) {
            uint256[] memory group = new uint256[](ATTENDEES - s * 2);
            for (uint256 i; i < group.length; ++i) {
                group[i] = ids[i];
            }
            badge.checkInBatch(group, sessions[s]);
        }

        badge.logNetworking(ids[0], 10); // 4 sessions + 10 = 14 -> Silver, one point from Gold
        badge.logNetworking(ids[1], 10);
        badge.logNetworking(ids[1], 2); // 4 + 12 = 16 -> Gold
        badge.logNetworking(ids[3], 5); // 3 + 5 = 8 -> Silver
        badge.markSpeaker(ids[2]); // Speaker

        vm.stopBroadcast();

        console.log("Seeded sessions:", sessions.length);
        console.log("Seeded attendees:", ATTENDEES);
    }
}
