// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {Badge, Tier, SILVER_SCORE, GOLD_SCORE, badgeScore, badgeTier} from "./BadgeTypes.sol";
import {BadgeRenderer} from "./BadgeRenderer.sol";

/// @title DynamicBadge
/// @notice Soulbound event badge whose traits, tier and artwork evolve as the holder attends
///         sessions, gives talks and networks. Metadata and SVG artwork are rendered fully on-chain.
/// @dev One badge per wallet. Staff (STAFF_ROLE) drive check-ins; attendees drive peer connections
///      with an EIP-712 signature from the other party. Implements ERC-4906 and ERC-5192.
contract DynamicBadge is ERC721, AccessControl, Pausable, EIP712 {
    struct Session {
        string name;
        bool active;
        uint32 attendance;
        uint40 createdAt;
    }

    bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");
    bytes32 public constant CONNECT_TYPEHASH = keccak256("Connect(uint256 tokenId,uint256 deadline)");

    uint256 public constant MAX_BATCH_SIZE = 200;
    uint16 public constant MAX_POINTS_PER_AWARD = 10;
    /// @notice Only the first N peer connections add networking score, which limits farming.
    uint16 public constant MAX_SCORED_CONNECTIONS = 10;
    uint256 public constant MAX_SIGNATURE_TTL = 1 hours;

    bytes4 private constant ERC4906_INTERFACE_ID = 0x49064906;
    bytes4 private constant ERC5192_INTERFACE_ID = 0xb45a3c0e;

    uint256 private _nextTokenId = 1;
    uint256 public sessionCount;

    mapping(uint256 tokenId => Badge) private _badges;
    /// @notice Token id held by a wallet, 0 if none. Ids start at 1.
    mapping(address owner => uint256 tokenId) public tokenOf;
    mapping(uint256 sessionId => Session) private _sessions;
    /// @dev Attendance bitmap: one storage word covers 256 token ids per session, so batch
    ///      check-ins mostly write to already-warm, non-zero slots.
    mapping(uint256 sessionId => mapping(uint256 word => uint256 bits)) private _attendance;
    mapping(bytes32 pairKey => bool) private _connected;

    event BadgeMinted(address indexed owner, uint256 indexed tokenId, address indexed mintedBy);
    event SessionCreated(uint256 indexed sessionId, string name);
    event SessionStatusChanged(uint256 indexed sessionId, bool active);
    event CheckedIn(uint256 indexed tokenId, uint256 indexed sessionId, uint16 sessionsAttended);
    event BatchCheckIn(uint256 indexed sessionId, uint256 processed, uint256 skipped);
    event SpeakerMarked(uint256 indexed tokenId, uint16 talksGiven);
    event NetworkingLogged(uint256 indexed tokenId, uint16 pointsAdded, uint16 networkingScore);
    event Connected(uint256 indexed tokenId, uint256 indexed peerTokenId);
    event TierChanged(uint256 indexed tokenId, Tier previousTier, Tier newTier);
    /// @dev ERC-4906: tells wallets and marketplaces to refresh the token's metadata.
    event MetadataUpdate(uint256 _tokenId);
    /// @dev ERC-5192: the token can never be transferred.
    event Locked(uint256 tokenId);

    error Soulbound();
    error AlreadyHasBadge(address account);
    error NoBadge(address account);
    error UnknownSession(uint256 sessionId);
    error SessionNotActive(uint256 sessionId);
    error InvalidSessionName();
    error AlreadyCheckedIn(uint256 tokenId, uint256 sessionId);
    error InvalidBatchSize(uint256 size);
    error InvalidPoints(uint16 points);
    error SignatureExpired(uint256 deadline);
    error DeadlineTooFar(uint256 deadline);
    error InvalidSignature();
    error CannotConnectToSelf();
    error AlreadyConnected(uint256 tokenId, uint256 peerTokenId);
    error NotCheckedInYet(uint256 tokenId);

    constructor(string memory name_, string memory symbol_, address admin)
        ERC721(name_, symbol_)
        EIP712(name_, "1")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(STAFF_ROLE, admin);
    }

    // ---------------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------------

    /// @notice Mint your own badge. One per wallet.
    function mint() external whenNotPaused returns (uint256) {
        return _mintBadge(msg.sender);
    }

    /// @notice Staff-sponsored mint for attendees who have no gas.
    function mintTo(address to) external onlyRole(STAFF_ROLE) whenNotPaused returns (uint256) {
        return _mintBadge(to);
    }

    // ---------------------------------------------------------------------
    // Sessions and check-ins (staff)
    // ---------------------------------------------------------------------

    function createSession(string calldata name) external onlyRole(STAFF_ROLE) returns (uint256 sessionId) {
        uint256 length = bytes(name).length;
        if (length == 0 || length > 64) revert InvalidSessionName();
        sessionId = ++sessionCount;
        _sessions[sessionId] =
        // forge-lint: disable-next-line(unsafe-typecast) uint40 seconds lasts until the year 36812
        Session({name: name, active: true, attendance: 0, createdAt: uint40(block.timestamp)});
        emit SessionCreated(sessionId, name);
    }

    function setSessionActive(uint256 sessionId, bool active) external onlyRole(STAFF_ROLE) {
        if (sessionId == 0 || sessionId > sessionCount) revert UnknownSession(sessionId);
        _sessions[sessionId].active = active;
        emit SessionStatusChanged(sessionId, active);
    }

    function checkIn(uint256 tokenId, uint256 sessionId) external onlyRole(STAFF_ROLE) whenNotPaused {
        _requireActiveSession(sessionId);
        _requireOwned(tokenId);
        if (!_checkIn(tokenId, sessionId)) revert AlreadyCheckedIn(tokenId, sessionId);
        _sessions[sessionId].attendance += 1;
    }

    /// @notice Check in many attendees in one transaction. Unminted or already checked-in ids are
    ///         skipped rather than reverting, so one bad scan never blocks the rest of the queue.
    function checkInBatch(uint256[] calldata tokenIds, uint256 sessionId)
        external
        onlyRole(STAFF_ROLE)
        whenNotPaused
        returns (uint256 processed)
    {
        _requireActiveSession(sessionId);
        uint256 size = tokenIds.length;
        if (size == 0 || size > MAX_BATCH_SIZE) revert InvalidBatchSize(size);
        // forge-lint: disable-next-line(uninitialized-local) loop counter intentionally starts at 0
        for (uint256 i; i < size;) {
            uint256 tokenId = tokenIds[i];
            if (_ownerOf(tokenId) != address(0) && _checkIn(tokenId, sessionId)) {
                unchecked {
                    ++processed;
                }
            }
            unchecked {
                ++i;
            }
        }
        // forge-lint: disable-next-line(unsafe-typecast) processed <= MAX_BATCH_SIZE
        _sessions[sessionId].attendance += uint32(processed);
        emit BatchCheckIn(sessionId, processed, size - processed);
    }

    // ---------------------------------------------------------------------
    // Talks and networking
    // ---------------------------------------------------------------------

    /// @notice Record a talk given by the holder. The first talk grants the Speaker tier.
    function markSpeaker(uint256 tokenId) external onlyRole(STAFF_ROLE) whenNotPaused {
        _requireOwned(tokenId);
        Badge memory b = _badges[tokenId];
        Tier previous = badgeTier(b);
        b.talksGiven += 1;
        b.isSpeaker = true;
        _badges[tokenId] = b;
        emit SpeakerMarked(tokenId, b.talksGiven);
        _afterUpdate(tokenId, previous, b);
    }

    /// @notice Staff award networking points directly (e.g. for a workshop activity).
    function logNetworking(uint256 tokenId, uint16 points) external onlyRole(STAFF_ROLE) whenNotPaused {
        if (points == 0 || points > MAX_POINTS_PER_AWARD) revert InvalidPoints(points);
        _requireOwned(tokenId);
        Badge memory b = _badges[tokenId];
        Tier previous = badgeTier(b);
        b.networkingScore += points;
        _badges[tokenId] = b;
        emit NetworkingLogged(tokenId, points, b.networkingScore);
        _afterUpdate(tokenId, previous, b);
    }

    /// @notice Connect with another attendee by submitting the Connect signature from their QR code.
    /// @dev The peer signs `Connect(peerTokenId, deadline)`. Both badges must have attended at least one
    ///      session, which ties networking to physical presence. Each pair can connect only once.
    function connect(uint256 peerTokenId, uint256 deadline, bytes calldata signature) external whenNotPaused {
        if (block.timestamp > deadline) revert SignatureExpired(deadline);
        if (deadline > block.timestamp + MAX_SIGNATURE_TTL) revert DeadlineTooFar(deadline);

        uint256 myTokenId = tokenOf[msg.sender];
        if (myTokenId == 0) revert NoBadge(msg.sender);
        if (myTokenId == peerTokenId) revert CannotConnectToSelf();
        address peer = _requireOwned(peerTokenId);

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(CONNECT_TYPEHASH, peerTokenId, deadline)));
        if (!SignatureChecker.isValidSignatureNow(peer, digest, signature)) revert InvalidSignature();

        Badge memory mine = _badges[myTokenId];
        Badge memory theirs = _badges[peerTokenId];
        if (mine.sessionsAttended == 0) revert NotCheckedInYet(myTokenId);
        if (theirs.sessionsAttended == 0) revert NotCheckedInYet(peerTokenId);

        bytes32 pairKey = _pairKey(myTokenId, peerTokenId);
        if (_connected[pairKey]) revert AlreadyConnected(myTokenId, peerTokenId);
        _connected[pairKey] = true;

        _applyConnection(myTokenId, mine);
        _applyConnection(peerTokenId, theirs);
        emit Connected(myTokenId, peerTokenId);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getBadge(uint256 tokenId)
        external
        view
        returns (Badge memory badge, uint256 score, Tier tier, address holder)
    {
        holder = _requireOwned(tokenId);
        badge = _badges[tokenId];
        score = badgeScore(badge);
        tier = badgeTier(badge);
    }

    function tierOf(uint256 tokenId) external view returns (Tier) {
        _requireOwned(tokenId);
        return badgeTier(_badges[tokenId]);
    }

    function scoreOf(uint256 tokenId) external view returns (uint256) {
        _requireOwned(tokenId);
        return badgeScore(_badges[tokenId]);
    }

    function tierThresholds() external pure returns (uint256 silver, uint256 gold) {
        return (SILVER_SCORE, GOLD_SCORE);
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function getSession(uint256 sessionId) external view returns (Session memory) {
        if (sessionId == 0 || sessionId > sessionCount) revert UnknownSession(sessionId);
        return _sessions[sessionId];
    }

    function hasAttended(uint256 tokenId, uint256 sessionId) public view returns (bool) {
        return _attendance[sessionId][tokenId >> 8] & (1 << (tokenId & 0xff)) != 0;
    }

    function isConnected(uint256 tokenId, uint256 peerTokenId) external view returns (bool) {
        return _connected[_pairKey(tokenId, peerTokenId)];
    }

    /// @notice ERC-5192: every badge is permanently locked to its holder.
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return BadgeRenderer.tokenURI(name(), tokenId, _badges[tokenId]);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return interfaceId == ERC4906_INTERFACE_ID || interfaceId == ERC5192_INTERFACE_ID
            || super.supportsInterface(interfaceId);
    }

    // ---------------------------------------------------------------------
    // Soulbound enforcement
    // ---------------------------------------------------------------------

    function approve(address, uint256) public pure override {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    /// @dev Allows minting only. Transfers and burns revert.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    function _mintBadge(address to) private returns (uint256 tokenId) {
        if (tokenOf[to] != 0) revert AlreadyHasBadge(to);
        tokenId = _nextTokenId++;
        tokenOf[to] = tokenId;
        // forge-lint: disable-next-line(unsafe-typecast) uint40 seconds lasts until the year 36812
        _badges[tokenId].mintedAt = uint40(block.timestamp);
        // forge-lint: disable-next-line(unsafe-oz-erc721-mint) _mint avoids the onERC721Received callback, removing a reentrancy path
        _mint(to, tokenId);
        emit BadgeMinted(to, tokenId, msg.sender);
        emit Locked(tokenId);
    }

    /// @return false if the badge was already checked in to this session.
    function _checkIn(uint256 tokenId, uint256 sessionId) private returns (bool) {
        uint256 word = tokenId >> 8;
        uint256 mask = 1 << (tokenId & 0xff);
        uint256 bits = _attendance[sessionId][word];
        if (bits & mask != 0) return false;
        _attendance[sessionId][word] = bits | mask;

        Badge memory b = _badges[tokenId];
        Tier previous = badgeTier(b);
        b.sessionsAttended += 1;
        _badges[tokenId] = b;
        emit CheckedIn(tokenId, sessionId, b.sessionsAttended);
        _afterUpdate(tokenId, previous, b);
        return true;
    }

    function _applyConnection(uint256 tokenId, Badge memory b) private {
        Tier previous = badgeTier(b);
        b.connections += 1;
        uint16 points = b.connections <= MAX_SCORED_CONNECTIONS ? 1 : 0;
        b.networkingScore += points;
        _badges[tokenId] = b;
        emit NetworkingLogged(tokenId, points, b.networkingScore);
        _afterUpdate(tokenId, previous, b);
    }

    function _afterUpdate(uint256 tokenId, Tier previous, Badge memory b) private {
        Tier current = badgeTier(b);
        if (current != previous) emit TierChanged(tokenId, previous, current);
        emit MetadataUpdate(tokenId);
    }

    function _requireActiveSession(uint256 sessionId) private view {
        if (sessionId == 0 || sessionId > sessionCount) revert UnknownSession(sessionId);
        if (!_sessions[sessionId].active) revert SessionNotActive(sessionId);
    }

    function _pairKey(uint256 a, uint256 b) private pure returns (bytes32) {
        return a < b ? keccak256(abi.encode(a, b)) : keccak256(abi.encode(b, a));
    }
}
