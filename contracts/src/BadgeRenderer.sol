// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Badge, Tier, SILVER_SCORE, GOLD_SCORE, badgeScore, badgeTier} from "./BadgeTypes.sol";
import {PassType} from "./PassType.sol";

/// @title BadgeRenderer
/// @notice Draws each badge as an event access pass and builds its ERC-721 metadata entirely on-chain.
/// @dev Output is a base64 data URI, so no IPFS pin or server is involved. The pass is a dark card with a
///      light edge so it reads on both light and dark pages.
library BadgeRenderer {
    using Strings for uint256;

    string private constant MONO = 'font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"';
    string private constant CARD = "#0E0F11";
    string private constant INK = "#F2F3F5";
    string private constant MUTED = "#8B8F98";
    uint256 private constant PUNCHES = 15;
    bytes1 private constant FILLER = "<";

    function tokenURI(string memory collection, uint256 tokenId, address holder, Badge memory b)
        public
        pure
        returns (string memory)
    {
        uint256 score = badgeScore(b);
        Tier tier = badgeTier(b);
        string memory image = Base64.encode(bytes(svg(collection, tokenId, holder, b, score, tier)));
        string memory json = string.concat(
            '{"name":"',
            collection,
            " #",
            tokenId.toString(),
            '","description":"Soulbound event pass that levels up with attendance, talks and networking. ',
            'Artwork and metadata are generated entirely on-chain.","image":"data:image/svg+xml;base64,',
            image,
            '","attributes":',
            attributes(b, score, tier),
            "}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function svg(
        string memory collection,
        uint256 tokenId,
        address holder,
        Badge memory b,
        uint256 score,
        Tier tier
    ) internal pure returns (string memory) {
        string memory band = tierColor(tier);
        return string.concat(
            _card(band),
            _header(collection, tokenId, holder),
            _band(tier),
            _stats(b),
            _punches(score, tier, band),
            _machineStrip(collection, tokenId, holder, b, tier),
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
        if (tier == Tier.Speaker) return "#A48BFF";
        if (tier == Tier.Gold) return "#F2C94C";
        if (tier == Tier.Silver) return "#C3CBD6";
        return "#E08A4B";
    }

    /// @dev Card body with a transparent lanyard slot cut through it and a hairline edge.
    function _card(string memory band) private pure returns (string memory) {
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 860" width="540" height="860">',
            '<defs><mask id="slot"><rect width="540" height="860" rx="30" fill="#fff"/>',
            '<rect x="226" y="34" width="88" height="16" rx="8" fill="#000"/></mask></defs>',
            '<g mask="url(#slot)"><rect width="540" height="860" rx="30" fill="',
            CARD,
            '"/><rect y="300" width="540" height="150" fill="',
            band,
            '"/></g><rect x=".75" y=".75" width="538.5" height="858.5" rx="29.25" fill="none" stroke="#fff" ',
            'stroke-opacity=".14" stroke-width="1.5"/><rect x="226.75" y="34.75" width="86.5" height="14.5" ',
            'rx="7.25" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.5"/>'
        );
    }

    function _header(string memory collection, uint256 tokenId, address holder)
        private
        pure
        returns (string memory)
    {
        bytes memory hexAddress = bytes(Strings.toHexString(holder));
        string memory shortHolder = string.concat(_slice(hexAddress, 0, 6), "...", _slice(hexAddress, 38, 42));
        return string.concat(
            _word(_upper(collection), 48, 124, 40, INK),
            string.concat('<text x="492" y="124" text-anchor="end" ', MONO, ' font-size="20" fill="', MUTED),
            string.concat('">No. ', _pad(tokenId, 3), "</text>"),
            string.concat("<text ", _label(48, 204, MUTED), ">HOLDER</text>"),
            string.concat(
                '<text x="48" y="248" ', MONO, ' font-size="30" fill="', INK, '">', shortHolder, "</text>"
            )
        );
    }

    function _band(Tier tier) private pure returns (string memory) {
        string memory onBand = string.concat(MONO, ' font-size="15" letter-spacing="2" fill="', CARD, '"');
        return string.concat(
            string.concat('<text x="48" y="338" ', onBand, ' fill-opacity=".7">ACCESS LEVEL</text>'),
            string.concat('<text x="492" y="338" text-anchor="end" ', onBand, ' fill-opacity=".7">'),
            string.concat("LV ", uint256(uint8(tier)).toString(), "</text>"),
            _word(_upper(tierName(tier)), 46, 424, tier == Tier.Speaker ? 84 : 96, CARD)
        );
    }

    function _stats(Badge memory b) private pure returns (string memory) {
        return string.concat(
            _stat(48, "SESSIONS", b.sessionsAttended),
            _stat(210, "TALKS", b.talksGiven),
            _stat(372, "NETWORK", b.networkingScore)
        );
    }

    function _stat(uint256 x, string memory label, uint256 value) private pure returns (string memory) {
        return string.concat(
            string.concat("<text ", _label(x, 516, MUTED), ">", label, "</text>"),
            _word(_pad(value, 2), x, 582, 66, INK)
        );
    }

    /// @dev One punch per point toward Gold, like a loyalty card. Speakers and Gold holders are fully punched.
    function _punches(uint256 score, Tier tier, string memory band) private pure returns (string memory) {
        uint256 filled = tier == Tier.Speaker || score > PUNCHES ? PUNCHES : score;
        string memory row = "";
        for (uint256 i; i < PUNCHES; ++i) {
            string memory x = (48 + i * 30).toString();
            row = i < filled
                ? string.concat(
                    row, '<rect x="', x, '" y="664" width="24" height="24" rx="5" fill="', band, '"/>'
                )
                : string.concat(
                    row,
                    '<rect x="',
                    x,
                    '" y="664.75" width="22.5" height="22.5" rx="4.25" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.5"/>'
                );
        }
        return string.concat(
            string.concat("<text ", _label(48, 646, INK), ">SCORE ", _pad(score, 2), "</text>"),
            string.concat(
                '<text x="492" y="646" text-anchor="end" ', MONO, ' font-size="15" letter-spacing="2"'
            ),
            string.concat(' fill="', MUTED, '">', _nextStep(score, tier), "</text>"),
            row
        );
    }

    /// @dev Passport-style machine-readable zone: collection, tier, id, then traits and the holder address.
    function _machineStrip(
        string memory collection,
        uint256 tokenId,
        address holder,
        Badge memory b,
        Tier tier
    ) private pure returns (string memory) {
        string memory first = string.concat(
            _fill(string.concat("P<", _upper(collection), "<", _upper(tierName(tier))), 29), _pad(tokenId, 3)
        );
        string memory traits = string.concat(
            "S", _pad(b.sessionsAttended, 2), "T", _pad(b.talksGiven, 2), "N", _pad(b.networkingScore, 2)
        );
        bytes memory hexAddress = bytes(Strings.toHexString(holder));
        string memory second = string.concat(traits, "<<", _upper(_slice(hexAddress, 2, 23)));
        string memory attrs = string.concat(MONO, ' font-size="19" letter-spacing="1.4" fill="', MUTED, '"');
        return string.concat(
            '<line x1="48" y1="730" x2="492" y2="730" stroke="#fff" stroke-opacity=".1"/>',
            string.concat('<text x="48" y="776" ', attrs, ">", _escapeLt(first), "</text>"),
            string.concat('<text x="48" y="812" ', attrs, ">", _escapeLt(second), "</text>")
        );
    }

    /// @dev Draws a word in the pass's own condensed letterforms, advancing glyph by glyph.
    function _word(string memory word, uint256 x, uint256 baseline, uint256 size, string memory color)
        private
        pure
        returns (string memory out)
    {
        bytes memory chars = bytes(word);
        string memory scale = string.concat(") scale(", _decimal(size), ",-", _decimal(size), ')" d="');
        out = string.concat('<g fill="', color, '">');
        uint256 cursor = x * 1000;
        for (uint256 i; i < chars.length; ++i) {
            (string memory path, uint256 advance) = PassType.glyph(chars[i]);
            if (bytes(path).length != 0) {
                out = string.concat(
                    out,
                    '<path transform="translate(',
                    _decimal(cursor),
                    " ",
                    baseline.toString(),
                    scale,
                    path,
                    '"/>'
                );
            }
            cursor += advance * size;
        }
        return string.concat(out, "</g>");
    }

    /// @dev Renders thousandths as a decimal string: 96 becomes "0.096", 1250 becomes "1.250".
    function _decimal(uint256 thousandths) private pure returns (string memory) {
        return string.concat((thousandths / 1000).toString(), ".", _pad(thousandths % 1000, 3));
    }

    function _nextStep(uint256 score, Tier tier) private pure returns (string memory) {
        if (tier == Tier.Speaker) return "ON STAGE";
        if (tier == Tier.Gold) return "TALK FOR SPEAKER";
        if (tier == Tier.Silver) return string.concat((GOLD_SCORE - score).toString(), " TO GOLD");
        return string.concat((SILVER_SCORE - score).toString(), " TO SILVER");
    }

    function _label(uint256 x, uint256 y, string memory color) private pure returns (string memory) {
        return string.concat(
            'x="',
            x.toString(),
            '" y="',
            y.toString(),
            '" ',
            MONO,
            ' font-size="15" letter-spacing="2" fill="',
            color,
            '"'
        );
    }

    function _numberTrait(string memory traitType, uint256 value) private pure returns (string memory) {
        return string.concat(
            '{"trait_type":"', traitType, '","display_type":"number","value":', value.toString(), "}"
        );
    }

    function _pad(uint256 value, uint256 width) private pure returns (string memory result) {
        result = value.toString();
        while (bytes(result).length < width) {
            result = string.concat("0", result);
        }
    }

    /// @dev Pads with "<" to exactly `width` characters, truncating longer input.
    function _fill(string memory value, uint256 width) private pure returns (string memory) {
        bytes memory source = bytes(value);
        bytes memory out = new bytes(width);
        for (uint256 i; i < width; ++i) {
            out[i] = i < source.length ? source[i] : FILLER;
        }
        return string(out);
    }

    /// @dev The machine-readable strip uses "<" as filler, which must be escaped inside SVG text.
    function _escapeLt(string memory value) private pure returns (string memory) {
        bytes memory source = bytes(value);
        uint256 count = 0;
        for (uint256 i; i < source.length; ++i) {
            if (source[i] == "<") ++count;
        }
        bytes memory out = new bytes(source.length + count * 3);
        uint256 j = 0;
        for (uint256 i; i < source.length; ++i) {
            if (source[i] == "<") {
                out[j++] = "&";
                out[j++] = "l";
                out[j++] = "t";
                out[j++] = ";";
            } else {
                out[j++] = source[i];
            }
        }
        return string(out);
    }

    function _upper(string memory value) private pure returns (string memory) {
        bytes memory out = bytes(value);
        bytes memory copy = new bytes(out.length);
        for (uint256 i; i < out.length; ++i) {
            bytes1 char = out[i];
            copy[i] = char >= 0x61 && char <= 0x7A ? bytes1(uint8(char) - 32) : char;
        }
        return string(copy);
    }

    function _slice(bytes memory data, uint256 start, uint256 end) private pure returns (string memory) {
        bytes memory out = new bytes(end - start);
        for (uint256 i = start; i < end; ++i) {
            out[i - start] = data[i];
        }
        return string(out);
    }
}
