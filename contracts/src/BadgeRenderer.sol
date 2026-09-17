// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Badge, Tier, SILVER_SCORE, GOLD_SCORE, badgeScore, badgeTier} from "./BadgeTypes.sol";

/// @title BadgeRenderer
/// @notice Builds a badge's SVG artwork and ERC-721 metadata JSON entirely on-chain.
/// @dev Output is a base64 data URI, so no IPFS pin or server is involved.
library BadgeRenderer {
    using Strings for uint256;

    string private constant SANS =
        'font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif"';
    string private constant SERIF = 'font-family="Georgia,Cambria,Times New Roman,serif"';
    string private constant MONO = 'font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"';
    string private constant INK = "#1C1917";
    string private constant MUTED = "#A8A29E";
    string private constant HAIRLINE = "#E7E5E4";

    function tokenURI(string memory collection, uint256 tokenId, Badge memory b)
        internal
        pure
        returns (string memory)
    {
        uint256 score = badgeScore(b);
        Tier tier = badgeTier(b);
        string memory image = Base64.encode(bytes(svg(collection, tokenId, b, score, tier)));
        string memory json = string.concat(
            '{"name":"',
            collection,
            " #",
            tokenId.toString(),
            '","description":"Soulbound event badge that evolves with attendance, talks and networking. ',
            'Artwork and metadata are generated entirely on-chain.","image":"data:image/svg+xml;base64,',
            image,
            '","attributes":',
            attributes(b, score, tier),
            "}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function svg(string memory collection, uint256 tokenId, Badge memory b, uint256 score, Tier tier)
        internal
        pure
        returns (string memory)
    {
        string memory accent = tierColor(tier);
        return string.concat(
            _frame(collection, tokenId, accent),
            _ring(score, tier, accent),
            _tierLabel(score, tier, accent),
            _stats(b),
            "</svg>"
        );
    }

    function attributes(Badge memory b, uint256 score, Tier tier) internal pure returns (string memory) {
        string memory numbers = string.concat(
            _numberTrait("Score", score),
            ",",
            _numberTrait("Sessions Attended", b.sessionsAttended),
            ",",
            _numberTrait("Talks Given", b.talksGiven),
            ",",
            _numberTrait("Networking Score", b.networkingScore),
            ",",
            _numberTrait("Connections", b.connections)
        );
        return string.concat(
            '[{"trait_type":"Tier","value":"',
            tierName(tier),
            '"},',
            numbers,
            ',{"trait_type":"Speaker","value":"',
            b.isSpeaker ? "Yes" : "No",
            '"},{"trait_type":"Minted","display_type":"date","value":',
            uint256(b.mintedAt).toString(),
            "}]"
        );
    }

    function tierName(Tier tier) internal pure returns (string memory) {
        if (tier == Tier.Speaker) return "Speaker";
        if (tier == Tier.Gold) return "Gold";
        if (tier == Tier.Silver) return "Silver";
        return "Bronze";
    }

    function tierColor(Tier tier) internal pure returns (string memory) {
        if (tier == Tier.Speaker) return "#7C5CBF";
        if (tier == Tier.Gold) return "#C9A227";
        if (tier == Tier.Silver) return "#8E9AA6";
        return "#B87333";
    }

    function _frame(string memory collection, uint256 tokenId, string memory accent)
        private
        pure
        returns (string memory)
    {
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">',
            '<rect width="500" height="500" rx="36" fill="#FAFAF9"/>',
            '<rect x="0.5" y="0.5" width="499" height="499" rx="35.5" fill="none" stroke="',
            HAIRLINE,
            '"/><circle cx="46" cy="58" r="4" fill="',
            accent,
            '"/><text x="60" y="63" ',
            SANS,
            string.concat(' font-size="14" font-weight="500" fill="#57534E">', collection, "</text>"),
            string.concat('<text x="458" y="63" text-anchor="end" ', MONO, ' font-size="13" fill="', MUTED),
            string.concat('">No. ', _pad(tokenId), "</text>")
        );
    }

    /// @dev Progress ring toward Gold. pathLength="100" lets us draw a percentage without trigonometry.
    function _ring(uint256 score, Tier tier, string memory accent) private pure returns (string memory) {
        uint256 pct = tier == Tier.Speaker || score >= GOLD_SCORE ? 100 : (score * 100) / GOLD_SCORE;
        string memory progress = pct == 0
            ? ""
            : string.concat(
                '<circle cx="250" cy="205" r="92" fill="none" stroke="',
                accent,
                '" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="',
                pct.toString(),
                ' 100" transform="rotate(-90 250 205)"/>'
            );
        return string.concat(
            '<circle cx="250" cy="205" r="92" fill="none" stroke="',
            HAIRLINE,
            '" stroke-width="10"/>',
            progress,
            string.concat(
                '<text x="250" y="222" text-anchor="middle" ', SERIF, ' font-size="60" fill="', INK
            ),
            string.concat('">', score.toString(), "</text>"),
            string.concat('<text x="250" y="252" text-anchor="middle" ', SANS, ' font-size="11"'),
            string.concat(' letter-spacing="2.2" fill="', MUTED, '">SCORE</text>')
        );
    }

    function _tierLabel(uint256 score, Tier tier, string memory accent) private pure returns (string memory) {
        return string.concat(
            string.concat(
                '<text x="250" y="352" text-anchor="middle" ', SERIF, ' font-size="34" fill="', INK
            ),
            string.concat('">', tierName(tier), "</text>"),
            string.concat(
                '<text x="250" y="380" text-anchor="middle" ', SANS, ' font-size="13" fill="', accent
            ),
            string.concat('">', _nextStep(score, tier), "</text>")
        );
    }

    function _nextStep(uint256 score, Tier tier) private pure returns (string memory) {
        if (tier == Tier.Speaker) return "On stage";
        if (tier == Tier.Gold) return "Top tier reached";
        if (tier == Tier.Silver) return string.concat((GOLD_SCORE - score).toString(), " to Gold");
        return string.concat((SILVER_SCORE - score).toString(), " to Silver");
    }

    function _stats(Badge memory b) private pure returns (string memory) {
        return string.concat(
            '<line x1="42" y1="408" x2="458" y2="408" stroke="',
            HAIRLINE,
            '"/>',
            _stat("42", "start", "SESSIONS", b.sessionsAttended),
            _stat("250", "middle", "TALKS", b.talksGiven),
            _stat("458", "end", "NETWORK", b.networkingScore)
        );
    }

    function _stat(string memory x, string memory anchor, string memory label, uint256 value)
        private
        pure
        returns (string memory)
    {
        string memory position = string.concat('x="', x, '" text-anchor="', anchor, '" ');
        return string.concat(
            string.concat(
                "<text ", position, 'y="438" ', SANS, ' font-size="10" letter-spacing="1.8" fill="'
            ),
            string.concat(MUTED, '">', label, "</text>"),
            string.concat("<text ", position, 'y="464" ', MONO, ' font-size="18" fill="', INK),
            string.concat('">', value.toString(), "</text>")
        );
    }

    function _numberTrait(string memory traitType, uint256 value) private pure returns (string memory) {
        return string.concat(
            '{"trait_type":"', traitType, '","display_type":"number","value":', value.toString(), "}"
        );
    }

    function _pad(uint256 tokenId) private pure returns (string memory) {
        if (tokenId < 10) return string.concat("00", tokenId.toString());
        if (tokenId < 100) return string.concat("0", tokenId.toString());
        return tokenId.toString();
    }
}
