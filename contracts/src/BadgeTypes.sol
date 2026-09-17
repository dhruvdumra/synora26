// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Score needed to reach each tier. Speaker is granted by staff, not by score.
uint256 constant SILVER_SCORE = 7;
uint256 constant GOLD_SCORE = 15;

/// @notice Tiers are always derived from a badge's traits, never stored, so they can't drift.
enum Tier {
    Bronze,
    Silver,
    Gold,
    Speaker
}

/// @notice Everything the contract knows about one badge. Packs into a single storage slot.
struct Badge {
    uint16 sessionsAttended;
    uint16 talksGiven;
    uint16 networkingScore;
    uint16 connections;
    bool isSpeaker;
    uint40 mintedAt;
}

/// @notice score = sessions + 3 * talks + networking
function badgeScore(Badge memory b) pure returns (uint256) {
    return uint256(b.sessionsAttended) + uint256(b.talksGiven) * 3 + uint256(b.networkingScore);
}

function badgeTier(Badge memory b) pure returns (Tier) {
    if (b.isSpeaker) return Tier.Speaker;
    uint256 score = badgeScore(b);
    if (score >= GOLD_SCORE) return Tier.Gold;
    if (score >= SILVER_SCORE) return Tier.Silver;
    return Tier.Bronze;
}
