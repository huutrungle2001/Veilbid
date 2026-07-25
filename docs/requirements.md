# VeilBid Requirements

## 1. Competition requirements

| ID | Requirement | Mandatory | Planned evidence |
|---|---|---:|---|
| CMP-001 | Functional front end | Yes | Public responsive web application |
| CMP-002 | End-to-end without mock core data | Yes | Real Sepolia tender lifecycle |
| CMP-003 | Ethereum Sepolia deployment | Yes | Addresses, transactions, runtime code |
| CMP-004 | Public open-source repository | Yes | GitHub URL and license |
| CMP-005 | README and comprehensive docs | Yes | Repository inspection |
| CMP-006 | Root `feedback.md` | Yes | Evidence-based implementation feedback |
| CMP-007 | Demo video no longer than four minutes | Yes | Published video duration |
| CMP-008 | X post tagging `@iEx_ec` | Yes | Public post |
| CMP-009 | DoraHacks submission | Yes per organizer transcript | Public submission page |
| CMP-010 | Independent VeilBid implementation | Yes | Repository history, contracts, tests, deployment, and evidence produced in this workspace |

## 2. Product requirements

| ID | Requirement | Priority | Acceptance condition |
|---|---|---|---|
| PRD-001 | Buyer creates a public tender | Must | Sepolia transaction and indexed event |
| PRD-002 | Buyer escrows real ERC-7984 test funds | Must | Wrapper collateral and encrypted balance evidence |
| PRD-003 | Vendor submits target-bound encrypted price | Must | Handle/proof accepted by the market |
| PRD-004 | Nox computes valid encrypted best bid | Must | Contract uses comparisons and `select` |
| PRD-005 | No plaintext bid shadow state | Must | Source/storage inspection |
| PRD-006 | Deadline closure is permissionless | Must | Non-owner caller succeeds |
| PRD-007 | Winner ID is publicly decrypted and proof-verified | Must | Proof and replay tests |
| PRD-008 | Winner payment and buyer refund are confidential | Must | Authorized deltas asserted and redacted |
| PRD-009 | Buyer/vendor can reveal authorized terms | Must | Wallet EIP-712 authorization |
| PRD-010 | Auditor receives selective viewer ACL | Must | ACL index and authorized reveal |
| PRD-011 | Safe can own and authorize a procurement budget | Must | Restricted module and live Safe flow |
| PRD-012 | Public tender explorer works wallet-free | Must | Event-derived lifecycle UI |
| PRD-013 | Finalization survives indexing/proof delay | Must | Recoverable activity item and retry |
| PRD-014 | Award receipt identifies public settlement | Should | ERC-721 metadata and ownership |
| PRD-015 | Stateless finalizer automates eligible work | Should | Dry-run, health, bounded actions |
| PRD-016 | MCP is read-only by default | Could | Explicit write opt-in and signer |
| PRD-017 | Strategy assistant drafts terms only | Could | Strict schema, no signing/decryption |

## 3. Security requirements

- Never log or persist plaintext bid values in public evidence.
- Never embed private keys or server-side fallback signers.
- State transitions must reject replay, double settlement, and stale finalizers.
- The buyer cannot override the proof-derived winner.
- The Safe module must restrict targets, selectors, tokens, and consumers.
- A viewer grant must not grant operator or spending authority.
- RPC, Nox, or indexer failure must not produce fake success.
- The product is testnet-only until independently audited.

## 4. Non-functional requirements

- Node and package versions are pinned and documented.
- Generated ABIs and addresses have one canonical source.
- CI covers compile, unit tests, artifact synchronization, lint, build, and
  secret scanning.
- Public event reads use bounded block ranges and rebuildable checkpoints.
- Frontend supports desktop and mobile without horizontal overflow.
- All release claims map to repeatable evidence.
