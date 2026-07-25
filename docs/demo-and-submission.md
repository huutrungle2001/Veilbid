# Demo and Submission Plan

## 1. Submission checklist

- [ ] Public independent GitHub repository.
- [x] Complete source code and MIT license.
- [x] Judge-first README.
- [x] Setup, deployment, use, architecture, threat model, and verification docs.
- [x] Root evidence-based `feedback.md`.
- [x] Public frontend backed by Ethereum Sepolia:
  `https://veilbid-three.vercel.app`.
- [ ] Demo video no longer than four minutes.
- [ ] X post with description, video, repository, live app, and `@iEx_ec`.
- [ ] DoraHacks VeilBid submission.
- [x] Final secret/privacy/claim review.

## 2. Target video script

### 0:00–0:25 — Problem and differentiator

Public bids leak vendor pricing. VeilBid gives a Safe treasury a public,
verifiable award while prices and payments remain confidential.

### 0:25–0:55 — Architecture and real state

Show Ethereum Sepolia, Safe ownership, Nox/ERC-7984 integration, live contract
addresses, and the public tender page without a wallet.

### 0:55–1:35 — Vendor bid

Connect one prepared vendor, enter a price, review privacy, encrypt, submit, and
show the confirmed handle/event. A second confirmed vendor bid is already
present.

### 1:35–2:25 — Close and proof-derived winner

Use a permissionless account to close. Show winner-ID proof readiness and
finalize. Explain that the UI never supplies a favored winner.

### 2:25–3:05 — Confidential settlement

Show the public winner and receipt. Authorized winner/buyer reveal proves the
confidential payment/refund; do not display plaintext values in public
repository evidence.

### 3:05–3:35 — Safe and selective audit

Show Safe ownership/module restriction and an auditor viewer ACL without spend
authority.

### 3:35–3:55 — Evidence and close

Show Etherscan, public source mapping, GitHub, and the one-sentence value.

## 3. Demo reliability

- Pre-fund buyer, Safe, vendors, and finalizer.
- Confirm faucet cooldown will not affect the recording.
- Prepare a second real bid and a proof-ready backup tender.
- Use a live action in the recording, not an all-pre-recorded mock.
- If proof indexing is slow, demonstrate the truthful Activity recovery item.
- Keep a verified fallback recording only; do not fake a pending proof.

## 4. Final claim review

Allowed only if verified:

- Encrypted prices and ERC-7984 settlement.
- Nox-computed best valid bid.
- Public proof-derived winner.
- Safe-owned treasury flow.
- Selective viewer disclosure.

Never claim:

- Anonymous bidders.
- Hidden tender metadata/timing.
- Guaranteed best vendor quality.
- Collusion or MEV elimination.
- Production audit or mainnet readiness.

## 5. Prepared X post

Replace the video placeholder only after checking that the final recording is
four minutes or shorter:

> VeilBid brings confidential reverse procurement to Safe treasuries.
>
> Vendors submit encrypted prices, iExec Nox computes the lowest valid bid, and
> only the proof-derived winner becomes public. ERC-7984 keeps settlement
> confidential, while scoped ACLs support selective audit.
>
> Live: https://veilbid-three.vercel.app
>
> Code: https://github.com/huutrungle2001/Veilbid
>
> Demo: [DEMO_VIDEO_URL]
>
> Built for the WTF Hackathon with @iEx_ec Nox on Ethereum Sepolia.

## 6. Prepared DoraHacks entry

- **Name:** VeilBid
- **Tagline:** Confidential procurement for Safe treasuries.
- **Repository:** `https://github.com/huutrungle2001/Veilbid`
- **Live app:** `https://veilbid-three.vercel.app`
- **Network:** Ethereum Sepolia
- **Demo:** `[DEMO_VIDEO_URL]`

Suggested description:

> Public procurement leaks commercial pricing before bidding closes. VeilBid
> lets a Safe treasury publish transparent tender rules and escrow confidential
> ERC-7984 test funds while approved vendors submit encrypted prices. iExec Nox
> validates bids and maintains the encrypted lowest-price/winner accumulator.
> After the deadline, only the winner ID is deliberately publicly decrypted and
> verified on-chain; the winning payment and buyer remainder stay confidential.
> A preparation-only Safe module cannot execute treasury transactions, scoped
> viewer ACLs enable selective audit, and a non-transferable receipt records the
> public award. The repository includes canonical Sepolia contracts, a
> wallet-free and role-based web app, a stateless finalizer, read-only MCP tools,
> source/runtime verification, and sanitized two-vendor lifecycle evidence.

Before submission, confirm that the GitHub repository is public, the video URL
works in a signed-out browser, the X post is public and tags `@iEx_ec`, and the
DoraHacks page links the same canonical app and repository.
