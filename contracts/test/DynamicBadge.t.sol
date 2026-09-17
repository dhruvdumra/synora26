// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {DynamicBadge} from "../src/DynamicBadge.sol";
import {Badge, Tier} from "../src/BadgeTypes.sol";

contract DynamicBadgeTest is Test {
    DynamicBadge internal badge;

    address internal admin = makeAddr("admin");
    address internal staff = makeAddr("staff");
    address internal alice;
    uint256 internal aliceKey;
    address internal bob;
    uint256 internal bobKey;
    address internal carol = makeAddr("carol");

    uint256 internal keynote;
    uint256 internal workshop;

    function setUp() public {
        (alice, aliceKey) = makeAddrAndKey("alice");
        (bob, bobKey) = makeAddrAndKey("bob");

        badge = new DynamicBadge("Loyl", "LOYL", admin);

        vm.startPrank(admin);
        badge.grantRole(badge.STAFF_ROLE(), staff);
        vm.stopPrank();

        vm.startPrank(staff);
        keynote = badge.createSession("Opening Keynote");
        workshop = badge.createSession("Solidity Workshop");
        vm.stopPrank();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    function _mintFor(address who) internal returns (uint256 tokenId) {
        vm.prank(who);
        tokenId = badge.mint();
    }

    function _newSession(string memory name) internal returns (uint256 sessionId) {
        vm.prank(staff);
        sessionId = badge.createSession(name);
    }

    function _checkInTimes(uint256 tokenId, uint256 times) internal {
        for (uint256 i; i < times; ++i) {
            uint256 sessionId = _newSession(string.concat("Session ", vm.toString(i)));
            vm.prank(staff);
            badge.checkIn(tokenId, sessionId);
        }
    }

    function _connectSignature(uint256 signerKey, uint256 tokenId, uint256 deadline)
        internal
        view
        returns (bytes memory)
    {
        (, string memory name, string memory version, uint256 chainId, address verifyingContract,,) =
            badge.eip712Domain();
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                verifyingContract
            )
        );
        bytes32 structHash = keccak256(abi.encode(badge.CONNECT_TYPEHASH(), tokenId, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _startsWith(string memory value, string memory prefix) internal pure returns (bool) {
        bytes memory v = bytes(value);
        bytes memory p = bytes(prefix);
        if (v.length < p.length) return false;
        for (uint256 i; i < p.length; ++i) {
            if (v[i] != p[i]) return false;
        }
        return true;
    }

    // ------------------------------------------------------------------
    // Minting
    // ------------------------------------------------------------------

    function test_Mint_AssignsBronzeBadgeStartingAtIdOne() public {
        vm.expectEmit(true, true, true, true);
        emit DynamicBadge.BadgeMinted(alice, 1, alice);
        uint256 tokenId = _mintFor(alice);

        assertEq(tokenId, 1);
        assertEq(badge.ownerOf(1), alice);
        assertEq(badge.tokenOf(alice), 1);
        assertEq(badge.totalMinted(), 1);
        assertEq(uint8(badge.tierOf(1)), uint8(Tier.Bronze));
        assertTrue(badge.locked(1));
    }

    function test_Mint_RevertsWhenWalletAlreadyHasBadge() public {
        _mintFor(alice);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.AlreadyHasBadge.selector, alice));
        badge.mint();
    }

    function test_MintTo_StaffCanSponsorMint() public {
        vm.prank(staff);
        uint256 tokenId = badge.mintTo(carol);
        assertEq(badge.ownerOf(tokenId), carol);
    }

    function test_MintTo_RevertsForNonStaff() public {
        bytes32 staffRole = badge.STAFF_ROLE();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, staffRole)
        );
        badge.mintTo(carol);
    }

    // ------------------------------------------------------------------
    // Soulbound
    // ------------------------------------------------------------------

    function test_Soulbound_TransfersAndApprovalsRevert() public {
        uint256 tokenId = _mintFor(alice);

        vm.startPrank(alice);
        vm.expectRevert(DynamicBadge.Soulbound.selector);
        badge.transferFrom(alice, bob, tokenId);

        vm.expectRevert(DynamicBadge.Soulbound.selector);
        badge.safeTransferFrom(alice, bob, tokenId);

        vm.expectRevert(DynamicBadge.Soulbound.selector);
        badge.approve(bob, tokenId);

        vm.expectRevert(DynamicBadge.Soulbound.selector);
        badge.setApprovalForAll(bob, true);
        vm.stopPrank();

        assertEq(badge.ownerOf(tokenId), alice);
    }

    // ------------------------------------------------------------------
    // Sessions and check-ins
    // ------------------------------------------------------------------

    function test_CheckIn_IncrementsSessionsAndEmits() public {
        uint256 tokenId = _mintFor(alice);

        vm.expectEmit(true, true, true, true);
        emit DynamicBadge.CheckedIn(tokenId, keynote, 1);
        vm.expectEmit(true, true, true, true);
        emit DynamicBadge.MetadataUpdate(tokenId);
        vm.prank(staff);
        badge.checkIn(tokenId, keynote);

        (Badge memory b, uint256 score,,) = badge.getBadge(tokenId);
        assertEq(b.sessionsAttended, 1);
        assertEq(score, 1);
        assertTrue(badge.hasAttended(tokenId, keynote));
        assertFalse(badge.hasAttended(tokenId, workshop));
        assertEq(badge.getSession(keynote).attendance, 1);
    }

    function test_CheckIn_RevertsOnDuplicate() public {
        uint256 tokenId = _mintFor(alice);
        vm.startPrank(staff);
        badge.checkIn(tokenId, keynote);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.AlreadyCheckedIn.selector, tokenId, keynote));
        badge.checkIn(tokenId, keynote);
        vm.stopPrank();
    }

    function test_CheckIn_RevertsForClosedOrUnknownSession() public {
        uint256 tokenId = _mintFor(alice);
        vm.startPrank(staff);
        badge.setSessionActive(keynote, false);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.SessionNotActive.selector, keynote));
        badge.checkIn(tokenId, keynote);

        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.UnknownSession.selector, 99));
        badge.checkIn(tokenId, 99);
        vm.stopPrank();
    }

    function test_CheckIn_RevertsForNonStaff() public {
        uint256 tokenId = _mintFor(alice);
        bytes32 staffRole = badge.STAFF_ROLE();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, staffRole)
        );
        badge.checkIn(tokenId, keynote);
    }

    function test_CheckIn_RevertsForUnmintedToken() public {
        vm.prank(staff);
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, 42));
        badge.checkIn(42, keynote);
    }

    function test_CheckInBatch_SkipsDuplicatesAndUnmintedIds() public {
        uint256 a = _mintFor(alice);
        uint256 b = _mintFor(bob);

        vm.prank(staff);
        badge.checkIn(a, keynote);

        uint256[] memory ids = new uint256[](4);
        ids[0] = a; // already checked in, skipped
        ids[1] = b;
        ids[2] = 777; // not minted, skipped
        ids[3] = b; // duplicate inside the batch, skipped

        vm.expectEmit(true, true, true, true);
        emit DynamicBadge.BatchCheckIn(keynote, 1, 3);
        vm.prank(staff);
        uint256 processed = badge.checkInBatch(ids, keynote);

        assertEq(processed, 1);
        assertTrue(badge.hasAttended(b, keynote));
        assertEq(badge.getSession(keynote).attendance, 2);
    }

    function test_CheckInBatch_RevertsOnInvalidSize() public {
        vm.startPrank(staff);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.InvalidBatchSize.selector, 0));
        badge.checkInBatch(new uint256[](0), keynote);

        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.InvalidBatchSize.selector, 201));
        badge.checkInBatch(new uint256[](201), keynote);
        vm.stopPrank();
    }

    function test_CheckInBatch_UsesLessGasThanIndividualCheckIns() public {
        uint256 attendees = 50;
        uint256[] memory ids = new uint256[](attendees);
        for (uint256 i; i < attendees; ++i) {
            vm.prank(staff);
            ids[i] = badge.mintTo(address(uint160(0x1000 + i)));
        }

        vm.startPrank(staff);
        uint256 gasBefore = gasleft();
        for (uint256 i; i < attendees; ++i) {
            badge.checkIn(ids[i], keynote);
        }
        uint256 individualGas = gasBefore - gasleft();

        gasBefore = gasleft();
        badge.checkInBatch(ids, workshop);
        uint256 batchGas = gasBefore - gasleft();
        vm.stopPrank();

        emit log_named_uint("50 individual check-ins (gas)", individualGas);
        emit log_named_uint("1 batch of 50 check-ins (gas)", batchGas);
        assertLt(batchGas, individualGas);
    }

    // ------------------------------------------------------------------
    // Tiers
    // ------------------------------------------------------------------

    function test_Tier_ProgressesBronzeSilverGold() public {
        uint256 tokenId = _mintFor(alice);

        _checkInTimes(tokenId, 6);
        assertEq(uint8(badge.tierOf(tokenId)), uint8(Tier.Bronze));

        uint256 seventh = _newSession("Session 7");
        vm.expectEmit(true, true, true, true);
        emit DynamicBadge.TierChanged(tokenId, Tier.Bronze, Tier.Silver);
        vm.prank(staff);
        badge.checkIn(tokenId, seventh);
        assertEq(uint8(badge.tierOf(tokenId)), uint8(Tier.Silver));

        vm.startPrank(staff);
        badge.logNetworking(tokenId, 7);
        vm.expectEmit(true, true, true, true);
        emit DynamicBadge.TierChanged(tokenId, Tier.Silver, Tier.Gold);
        badge.logNetworking(tokenId, 1);
        vm.stopPrank();

        assertEq(badge.scoreOf(tokenId), 15);
        assertEq(uint8(badge.tierOf(tokenId)), uint8(Tier.Gold));
    }

    function test_MarkSpeaker_OverridesTierAndCountsTalks() public {
        uint256 tokenId = _mintFor(alice);

        vm.expectEmit(true, true, true, true);
        emit DynamicBadge.TierChanged(tokenId, Tier.Bronze, Tier.Speaker);
        vm.prank(staff);
        badge.markSpeaker(tokenId);

        vm.prank(staff);
        badge.markSpeaker(tokenId);

        (Badge memory b, uint256 score, Tier tier,) = badge.getBadge(tokenId);
        assertTrue(b.isSpeaker);
        assertEq(b.talksGiven, 2);
        assertEq(score, 6);
        assertEq(uint8(tier), uint8(Tier.Speaker));
    }

    function test_LogNetworking_RejectsOutOfRangePoints() public {
        uint256 tokenId = _mintFor(alice);
        vm.startPrank(staff);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.InvalidPoints.selector, 0));
        badge.logNetworking(tokenId, 0);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.InvalidPoints.selector, 11));
        badge.logNetworking(tokenId, 11);
        vm.stopPrank();
    }

    function testFuzz_ScoreMatchesFormula(uint8 sessions, uint8 talks, uint8 awards) public {
        sessions = uint8(bound(sessions, 0, 20));
        talks = uint8(bound(talks, 0, 5));
        awards = uint8(bound(awards, 0, 5));
        uint256 tokenId = _mintFor(alice);

        _checkInTimes(tokenId, sessions);
        vm.startPrank(staff);
        for (uint256 i; i < talks; ++i) {
            badge.markSpeaker(tokenId);
        }
        for (uint256 i; i < awards; ++i) {
            badge.logNetworking(tokenId, 10);
        }
        vm.stopPrank();

        uint256 expectedScore = uint256(sessions) + uint256(talks) * 3 + uint256(awards) * 10;
        assertEq(badge.scoreOf(tokenId), expectedScore);

        Tier expected = talks > 0
            ? Tier.Speaker
            : expectedScore >= 15 ? Tier.Gold : expectedScore >= 7 ? Tier.Silver : Tier.Bronze;
        assertEq(uint8(badge.tierOf(tokenId)), uint8(expected));
    }

    // ------------------------------------------------------------------
    // Peer connections (EIP-712)
    // ------------------------------------------------------------------

    function _mintAndCheckInPair() internal returns (uint256 a, uint256 b) {
        a = _mintFor(alice);
        b = _mintFor(bob);
        vm.startPrank(staff);
        badge.checkIn(a, keynote);
        badge.checkIn(b, keynote);
        vm.stopPrank();
    }

    function test_Connect_AwardsBothSidesWithValidSignature() public {
        (uint256 a, uint256 b) = _mintAndCheckInPair();
        uint256 deadline = block.timestamp + 10 minutes;
        bytes memory aliceSig = _connectSignature(aliceKey, a, deadline);

        vm.expectEmit(true, true, true, true);
        emit DynamicBadge.Connected(b, a);
        vm.prank(bob);
        badge.connect(a, deadline, aliceSig);

        (Badge memory aliceBadge,,,) = badge.getBadge(a);
        (Badge memory bobBadge,,,) = badge.getBadge(b);
        assertEq(aliceBadge.networkingScore, 1);
        assertEq(bobBadge.networkingScore, 1);
        assertEq(aliceBadge.connections, 1);
        assertTrue(badge.isConnected(a, b));
        assertTrue(badge.isConnected(b, a));
    }

    function test_Connect_RevertsWhenPairAlreadyConnected() public {
        (uint256 a, uint256 b) = _mintAndCheckInPair();
        uint256 deadline = block.timestamp + 10 minutes;

        bytes memory aliceSig = _connectSignature(aliceKey, a, deadline);
        vm.prank(bob);
        badge.connect(a, deadline, aliceSig);

        bytes memory bobSig = _connectSignature(bobKey, b, deadline);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.AlreadyConnected.selector, a, b));
        badge.connect(b, deadline, bobSig);
    }

    function test_Connect_RevertsWithSignatureFromWrongWallet() public {
        (uint256 a,) = _mintAndCheckInPair();
        uint256 deadline = block.timestamp + 10 minutes;
        bytes memory forged = _connectSignature(bobKey, a, deadline);

        vm.prank(bob);
        vm.expectRevert(DynamicBadge.InvalidSignature.selector);
        badge.connect(a, deadline, forged);
    }

    function test_Connect_RevertsWhenExpiredOrTooFar() public {
        (uint256 a,) = _mintAndCheckInPair();

        uint256 expired = vm.getBlockTimestamp() + 1 minutes;
        bytes memory sig = _connectSignature(aliceKey, a, expired);
        vm.warp(expired + 1);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.SignatureExpired.selector, expired));
        badge.connect(a, expired, sig);

        uint256 far = vm.getBlockTimestamp() + 2 hours;
        sig = _connectSignature(aliceKey, a, far);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.DeadlineTooFar.selector, far));
        badge.connect(a, far, sig);
    }

    function test_Connect_RequiresBothBadgesCheckedIn() public {
        uint256 a = _mintFor(alice);
        uint256 b = _mintFor(bob);
        vm.prank(staff);
        badge.checkIn(a, keynote);

        uint256 deadline = block.timestamp + 10 minutes;
        bytes memory sig = _connectSignature(aliceKey, a, deadline);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.NotCheckedInYet.selector, b));
        badge.connect(a, deadline, sig);
    }

    function test_Connect_RevertsForSelfAndWalletWithoutBadge() public {
        (uint256 a,) = _mintAndCheckInPair();
        uint256 deadline = block.timestamp + 10 minutes;
        bytes memory sig = _connectSignature(aliceKey, a, deadline);

        vm.prank(alice);
        vm.expectRevert(DynamicBadge.CannotConnectToSelf.selector);
        badge.connect(a, deadline, sig);

        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(DynamicBadge.NoBadge.selector, carol));
        badge.connect(a, deadline, sig);
    }

    function test_Connect_StopsScoringAfterCap() public {
        uint256 a = _mintFor(alice);
        vm.prank(staff);
        badge.checkIn(a, keynote);
        uint256 deadline = block.timestamp + 10 minutes;
        bytes memory aliceSig = _connectSignature(aliceKey, a, deadline);

        uint256 peers = uint256(badge.MAX_SCORED_CONNECTIONS()) + 2;
        for (uint256 i; i < peers; ++i) {
            address peer = address(uint160(0x2000 + i));
            vm.prank(staff);
            uint256 peerToken = badge.mintTo(peer);
            vm.prank(staff);
            badge.checkIn(peerToken, keynote);
            vm.prank(peer);
            badge.connect(a, deadline, aliceSig);
        }

        (Badge memory b,,,) = badge.getBadge(a);
        assertEq(b.connections, peers);
        assertEq(b.networkingScore, badge.MAX_SCORED_CONNECTIONS());
    }

    // ------------------------------------------------------------------
    // Admin controls
    // ------------------------------------------------------------------

    function test_Pause_BlocksStateChangesUntilUnpaused() public {
        uint256 tokenId = _mintFor(alice);
        vm.prank(admin);
        badge.pause();

        vm.prank(bob);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        badge.mint();

        vm.prank(staff);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        badge.checkIn(tokenId, keynote);

        vm.prank(admin);
        badge.unpause();
        vm.prank(staff);
        badge.checkIn(tokenId, keynote);
    }

    function test_Pause_OnlyAdmin() public {
        bytes32 adminRole = badge.DEFAULT_ADMIN_ROLE();
        vm.prank(staff);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, staff, adminRole)
        );
        badge.pause();
    }

    // ------------------------------------------------------------------
    // Metadata
    // ------------------------------------------------------------------

    function test_TokenURI_IsBase64JsonDataUri() public {
        uint256 tokenId = _mintFor(alice);
        string memory uri = badge.tokenURI(tokenId);
        assertTrue(_startsWith(uri, "data:application/json;base64,"));
    }

    function test_TokenURI_ChangesWhenTierChanges() public {
        uint256 tokenId = _mintFor(alice);
        string memory before = badge.tokenURI(tokenId);
        vm.prank(staff);
        badge.markSpeaker(tokenId);
        assertNotEq(keccak256(bytes(before)), keccak256(bytes(badge.tokenURI(tokenId))));
    }

    function test_SupportsExpectedInterfaces() public view {
        assertTrue(badge.supportsInterface(type(IERC721).interfaceId));
        assertTrue(badge.supportsInterface(type(IERC721Metadata).interfaceId));
        assertTrue(badge.supportsInterface(type(IAccessControl).interfaceId));
        assertTrue(badge.supportsInterface(0x49064906)); // ERC-4906
        assertTrue(badge.supportsInterface(0xb45a3c0e)); // ERC-5192
    }
}
