# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Hackathon judges (Synora26, Track 4 Web3 & Blockchain, problem 03).** Watch a live demo driven by the builder on a laptop or projector. They judge dynamic metadata reliability, security of state-change authorization, token-gating latency, gas efficiency of batch check-ins, and end-to-end dApp flow.
- **Event attendees.** Use the site on their phones at the venue: mint a badge, show a check-in code at session doors, swap connect codes with people they meet, check perks and the leaderboard.
- **Event staff.** Run sessions and check people in from a laptop or phone at the door, often in a queue.

Both the judge demo and on-site phone use matter equally.

## Product Purpose

Loyl is an evolving event badge. Each attendee holds one soulbound NFT whose traits (sessions attended, talks given, networking score) and tier (Bronze, Silver, Gold, Speaker) change on-chain as they take part. Tiers unlock gated perks. Success on judging day: a judge sees a badge mint, a staff check-in land, and the attendee's badge visibly level up and unlock a perk without a page refresh.

## Positioning

The badge's artwork and metadata are rendered entirely by the smart contract from live on-chain state, so the credential cannot drift from the truth and needs no image host or IPFS. Progress is earned, not bought: badges are non-transferable, networking points require a signature from the other attendee, and check-ins require staff roles.

## Operating Context

- Live demo on a laptop or projector, plus attendees on phones in a busy venue with QR scanning at doors.
- Sepolia testnet for the judged deployment; local Anvil chain as a fallback demo.
- Wallets: MetaMask and WalletConnect-compatible mobile wallets; staff can sponsor mints for attendees without gas.

## Capabilities and Constraints

- Contract (Solidity, Foundry): one badge per wallet, soulbound (ERC-5192), ERC-4906 metadata updates, STAFF and ADMIN roles, pause, sessions with once-per-session check-in, batch check-in that skips duplicates, EIP-712 signed peer connections, on-chain SVG and JSON metadata.
- Score = sessions + 3 x talks + networking. Silver at 7, Gold at 15, Speaker granted when staff record a talk.
- Web app (React, Vite, Tailwind v4, shadcn/ui, wagmi, RainbowKit): home, my badge, public badge with staff quick check-in, connect, staff console, leaderboard, perks.
- Planned: indexer API (Express, SQLite) for cached leaderboard, live stream and signature-verified perk delivery; AWS deployment (S3, CloudFront, EC2, GitHub Actions).
- Undecided: final perk content.

## Brand Commitments

- Product name: **Loyl**. Team: NCrypt. Event: Synora26.
- The builder wants it to feel crypto and blockchain native, minimalist, professional and cool.
- The builder rejected the previous look (warm cream and near-black with a serif display and a white badge card on the dark theme) as generic AI output.
- Built with shadcn/ui components.

## Evidence on Hand

- Real gas measurement from the contract test suite: 50 individual check-ins used 2,639,893 gas; one batch of the same 50 used 716,761 gas.
- 29 passing contract tests.
- No customers, testimonials, partners, or usage numbers exist. Do not invent them.

## Product Principles

1. The chain is the source of truth; the interface shows on-chain state and never implies more than the contract guarantees.
2. The level-up moment is the product. Every surface should make state change visible and immediate.
3. Earned, not bought: design never suggests badges or perks can be purchased or transferred.
4. Works at the door: fast, legible, one-handed on a phone in a crowded room.

## Accessibility & Inclusion

WCAG 2.1 AA contrast and keyboard access. Tier must never be conveyed by color alone. Respect reduced motion.
