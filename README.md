# Loyl

An event pass that levels up on-chain. Built by **NCrypt** for **Synora26**, Track 4 (Web3 & Blockchain),
problem 03: Dynamic NFT loyalty and token-gated community platform.

Each attendee holds one soulbound NFT. Staff check people in at session doors, attendees meet each other,
and the pass re-issues itself at a higher tier as its traits change. The artwork and metadata are drawn by
the smart contract from live on-chain state, so the credential can never drift from the truth.



## What it does

| | |
|---|---|
| **One pass per wallet** | Soulbound (ERC-5192). It cannot be sold or transferred, so a Gold perk only reaches someone who showed up. |
| **Tiers from traits** | score = sessions + 3 x talks + networking. Silver at 7, Gold at 15. A recorded talk grants Speaker. |
| **Live artwork** | `tokenURI` returns a data URI built in Solidity: a black PVC pass with a lanyard slot, a tier-coloured access band, score punches and a passport-style machine-readable strip. No IPFS, no image host. |
| **Batch check-in** | 50 attendees in one transaction uses **716,761 gas** against **2,639,893** one at a time, a 73% saving. Duplicates and unknown ids are skipped rather than failing the batch. |
| **Signed introductions** | Two checked-in attendees swap a QR code carrying an EIP-712 signature. The contract verifies it and credits both, once per pair. |
| **Real gating** | Perk bodies are released by the indexer only after a wallet signature and a fresh on-chain tier read. Locked content never ships to the browser. |
| **Live updates** | Every page reacts to contract events: the pass re-issues, the leaderboard reorders, perks unlock, with no refresh. |

## Layout

```
contracts/   Solidity (Foundry): DynamicBadge, BadgeRenderer, PassType glyph outlines
web/         React + Vite + Tailwind v4 + shadcn/ui + wagmi/viem/RainbowKit
indexer/     Express + node:sqlite + viem: event cache, REST API, live stream, perk gate
infra/       Docker Compose, Nginx, EC2 user data, IAM policies, CloudFront function
docs/        AWS setup guide
scripts/     ABI sync and the glyph extraction pipeline
```

## Architecture

```
                     ┌──────────────────────────────┐
  attendee phone ───►│  CloudFront (one domain)     │
  judge laptop       │  /        → S3 static site   │
                     │  /api/*   → EC2 origin       │
                     └───────┬──────────────┬───────┘
                             │              │
                    S3 (private, OAC)   EC2 t3.micro
                                        Nginx :80
                                            │
                                     indexer :3001 ──► SQLite (volume)
                                            │
                                            ▼
                              Sepolia  ◄── DynamicBadge + BadgeRenderer
                                            ▲
                          wallets (mint, connect) and staff (check-in)
```

The chain is the source of truth. The indexer is a cache that can be rebuilt from events at any time, and
the site falls back to reading the contract directly when the indexer is unavailable.

## Running it locally

Needs Node 24 and [Foundry](https://getfoundry.sh).

```bash
# 1. a local chain
anvil

# 2. contracts: build, test, deploy and seed demo data
cd contracts && npm install && forge test
forge script script/Deploy.s.sol --rpc-url local --broadcast --unlocked \
  --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
forge script script/SeedDemo.s.sol --rpc-url local --broadcast --unlocked \
  --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# 3. share the ABI with the app and the indexer
cd .. && node scripts/sync-contracts.mjs

# 4. indexer (copy .env.example to .env and paste the deployed address)
cd indexer && npm install && npm run dev

# 5. the site (copy .env.example to .env.local and paste the same address)
cd ../web && npm install && npm run dev
```

Open http://127.0.0.1:5173. On a local chain the wallet list offers **Local test accounts**, so you can
drive both sides without a browser extension: connect as *Local staff* for the door console, and as a
*Local attendee* in a second window to mint a pass and watch it re-issue.

## Deploying to Sepolia

```bash
cd contracts
cp .env.example .env            # add SEPOLIA_RPC_URL and ETHERSCAN_API_KEY
cast wallet import loyl-admin --interactive   # paste the deployer key once; it is stored encrypted
forge script script/Deploy.s.sol --rpc-url sepolia --account loyl-admin --broadcast --verify
forge script script/SeedDemo.s.sol --rpc-url sepolia --account loyl-admin --broadcast
```

The address and deployment block land in `contracts/deployments/11155111.json`. Feed them to the site and
the indexer, then follow [docs/aws-setup.md](docs/aws-setup.md) for S3, CloudFront, ECR, EC2 and the
GitHub Actions deploy. CI runs contract tests with a gas report, type-checks the app and the indexer, and
builds the container image on every push.

## How the judging criteria are met

- **Dynamic metadata reliability.** Tiers are derived from traits on every read, never stored, so they
  cannot go stale. Every state change emits ERC-4906 `MetadataUpdate` so wallets refresh, and the frontend
  re-reads `tokenURI` from the same event.
- **Security of state-change authorization.** Check-ins, talks and points require `STAFF_ROLE`; only the
  admin can pause. Passes are soulbound. Peer connections need an EIP-712 signature from the other holder,
  both sides must already be checked in, each pair counts once, and scored connections are capped.
- **Token-gating latency.** The perk gate verifies a signature and reads the tier on-chain in single-digit
  milliseconds, measured and shown in the UI.
- **Gas efficiency.** Attendance uses a bitmap so a batch mostly writes warm storage; traits pack into one
  slot; the batch path skips rather than reverts. Numbers above come from the test suite.
- **End-to-end flow.** Mint, check in, level up, unlock, and a staff console for the door, all live.

## Tests

```bash
cd contracts && forge test -vv        # 29 tests
cd contracts && forge test --gas-report
cd web && npx tsc -b && npm run build
cd indexer && npm run typecheck
```
