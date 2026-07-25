# Important Notes

> Status: Active source, deadline, conflict, and decision register.

## 1. Source register

| ID | Source | Type | Priority | Location |
|---|---|---|---:|---|
| SRC-001 | Hackathon challenge brief | User-provided capture | 7 | `docs/original/user-provided-challenge-brief.md` |
| SRC-002 | Discord organizer/support context | User-provided transcript extract | 7 until independently verified | `docs/original/discord-context-extract.md` |
| SRC-003 | iExec Nox documentation/packages | Sponsor technical source | 4 | URLs in source documents |
| SRC-004 | User confirmation that multiple submissions are allowed | User decision/report | 7 | Conversation on 2026-07-25 |

## 2. Deadline

Working deadline: `2026-08-02 04:59`, timezone not independently verified.
Until verified from the official event page, plan to finish publication at least
24 hours earlier.

## 3. Confirmed working decisions

- Product: VeilBid — Confidential Procurement for Safe Treasuries.
- Separate repository, branding, contracts, Safe, deployment, evidence, video,
  X post, and DoraHacks submission.
- Architecture must independently cover confidential computation, treasury
  custody, proof recovery, public automation, selective disclosure, indexing,
  client synchronization, and release verification.
- Raw local chat context is not committed by default.
- Safe and Nox are core, not optional labels.
- Winner identity may be public after close; bid prices stay confidential.
- Feasibility runtime evidence is Sepolia-first; Docker-backed local Nox is an
  optional regression environment and is not a phase blocker.
- Public frontend deployments use Vercel through the installed CLI. The
  canonical production URL is `https://veilbid-three.vercel.app`; deployment
  `dpl_CYwLk2y7fNeTfKfHiZ7Zv63vRZ1b` passed release smoke.

## 4. Organizer-context notes requiring care

- Ethereum Sepolia chain ID `11155111` is the required network.
- The transcript reports that Nox protocol contracts `0.2.4` include Ethereum
  Sepolia support.
- The transcript recommends integrating Nox over an existing open-source
  protocol; VeilBid uses Safe as the treasury authority.
- The transcript says a real-person walkthrough is preferred, while a clear
  generated video may be accepted.
- The transcript directs builders to DoraHacks submission in addition to the X
  post.

These statements are captured from a user-provided Discord transcript. Verify
material submission facts through the official event page before publication.

## 5. Known technical warnings

- A community report described `NotAllowed` when reusing a self-minted
  confidential token balance handle across transactions.
- ACL/indexing timing is an unverified VeilBid risk until measured in its own
  local and Sepolia tests.
- Smart-account inputs need an owner-to-restricted-module pattern because a Safe
  cannot produce the same EOA Handle SDK authorization.
- Public-decryption finalization must be recoverable after indexing delay.
- Never clear the lockfile merely to “get latest” during a release; pin and
  validate known-compatible versions.
- The pinned Handle SDK source contains built-in Ethereum Sepolia configuration
  for chain `11155111`, including the NoxCompute address, gateway, and subgraph.

## 6. Open questions

| ID | Question | Required by |
|---|---|---|
| Q-001 | What is the independently verified deadline timezone? | Before submission |
| Q-002 | What exact Safe deployment/module pattern will the new workspace use? | Build design |
| Q-003 | Can cross-contract encrypted settlement pass ACL tests reliably? | Feasibility gate |
