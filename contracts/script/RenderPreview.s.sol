// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {BadgeRenderer} from "../src/BadgeRenderer.sol";
import {Badge, badgeScore, badgeTier} from "../src/BadgeTypes.sol";

/// @notice Writes the on-chain SVG for one badge per tier to ./previews for visual review.
/// @dev forge script script/RenderPreview.s.sol
contract RenderPreview is Script {
    function run() external {
        vm.createDir("previews", true);
        _write("bronze", 7, Badge(3, 0, 1, 1, false, 0));
        _write("silver", 18, Badge(6, 0, 4, 4, false, 0));
        _write("gold", 42, Badge(9, 0, 8, 8, false, 0));
        _write("speaker", 3, Badge(4, 2, 5, 5, true, 0));
    }

    function _write(string memory label, uint256 tokenId, Badge memory b) internal {
        string memory image = BadgeRenderer.svg("NCrypt Pass", tokenId, b, badgeScore(b), badgeTier(b));
        vm.writeFile(string.concat("previews/", label, ".svg"), image);
    }
}
