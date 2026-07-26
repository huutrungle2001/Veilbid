# VeilBid — Agent and Contributor Guide

## 1. Objective

This repository contains VeilBid, a confidential procurement protocol for Safe
treasuries built for the iExec WTF Hackathon Summer Edition.

Preserve the core product claim: buyers escrow confidential ERC-7984 funds,
vendors submit encrypted bids, iExec Nox selects the best valid bid without
revealing bid values, and a publicly verifiable winner can receive confidential
settlement.

The target engineering standard is production-grade for a hackathon submission:
a real Ethereum Sepolia deployment, substantive Nox computation, Safe
composability, a complete front end, stateless automation, explicit privacy
boundaries, repeatable verification, and a judge-friendly repository.

## 2. Onboarding

Read these files before making changes:

1. `README.md`
2. `PLAN.md`
3. `docs/product-plan.md`
4. `docs/feasibility-plan.md`
5. `docs/build-plan.md`
6. `docs/architecture.md`
7. `docs/contract-spec.md`
8. `docs/threat-model.md`
9. `docs/verification.md`
10. `docs/repository-layout.md`

For competition or submission decisions, also read:

- `docs/competition-summary.md`
- `docs/requirements.md`
- `docs/judging-criteria.md`
- `docs/important-notes.md`
- `docs/research-plan.md`
- `docs/idea-selection.md`
- `docs/demo-and-submission.md`

## 3. Source priority

`docs/original/` contains captured source inputs. A file being stored there does
not make it official.

Use this priority order:

1. Official rules or DoraHacks event page.
2. Official challenge page.
3. Official FAQ or organizer announcement.
4. Sponsor technical documentation and packages.
5. Direct organizer response.
6. Third-party sources.
7. User-provided captures or transcripts.
8. Agent inference.

When a canonical document conflicts with a higher-priority source, stop using
the conflicting claim, verify the source, update the canonical document, and
record the resolution in `docs/important-notes.md`.

## 4. Repository map

VeilBid uses a compact monorepo layout:

- `apps/web/`: landing page and Buyer, Vendor, Public, Activity, Auditor, and
  Safe Treasury interface.
- `apps/relay/`: stateless close, public-decryption, finalize, and refund
  automation.
- `apps/console/`: MCP stdio tools and local procurement CLI; read-only by
  default.
- `packages/contracts/`: the shared Hardhat/Nox workspace. Production Auction
  House contracts remain separate from isolated feasibility contracts and
  tests inside this package.
- `packages/chain-bindings/`: generated ABI/address snapshots, event codecs,
  public index, and domain types.
- `tooling/scripts/`: repository preflight, evidence validation, and secret
  scanning.
- `evidence/`: sanitized schemas and public local/Sepolia verification output.
- `docs/`: product, competition, threat model, original sources, and submission
  documentation.

Feasibility contracts under `packages/contracts/contracts/feasibility/` are
never production deployment inputs. Production source, tests, and manifests
remain independently identifiable inside the same pinned toolchain.

## 5. Architecture invariants

- Nox must perform winner eligibility/comparison and encrypted selection in the
  real settlement path.
- Never branch on a client-provided plaintext winner or maintain a plaintext
  shadow bid ledger.
- Bid values and confidential payments remain Nox handles on-chain.
- Public metadata is explicit: tender identity, buyer, bidder addresses, public
  ceiling, deadlines, status, winner, transaction hashes, and receipt IDs.
- The winning vendor may become public; losing and winning bid values must not
  become public by default.
- A Safe module may prepare handles, but it exposes no Safe execution function;
  only a normal transaction satisfying the Safe threshold can move Safe-owned
  funds.
- Public decryption is limited to handles deliberately marked for it, such as
  the encrypted winner ID. Every proof is verified on-chain and replay-protected.
- Finalizers and MCP clients cannot decrypt vendor bids unless separately
  authorized as viewers.
- Auditor access is per-handle and does not imply token operator, Safe signer, or
  protocol administration authority.
- There is no success fallback using mock data when Nox, RPC, or indexing fails.

## 6. Change rules

- Keep Safe and iExec Nox central to the implemented flow.
- Use the official Nox/ERC-7984 packages and supported Ethereum Sepolia network.
- Do not reuse another project's deployment addresses, Safe, artifacts,
  contracts, branding, evidence, documentation, or submission media.
- VeilBid protocol logic, architecture decisions, tests, deployments, and
  evidence must be created and validated inside this workspace.
- Do not expose private keys, plaintext bids, confidential balances, encrypted
  handles, proofs, wallet signatures, or seed material in logs or evidence.
- Do not claim anonymous bidders, secret public metadata, service-quality
  verification, production security, or formal auditing.
- Do not add a database, authentication service, autonomous AI custody, or major
  feature unless it supports an approved requirement.
- Do not change deployed addresses or canonical artifacts without completing the
  deployment and synchronization workflow.
- Update `PLAN.md` when phase, status, blocker, or next action changes.

## 7. Validation

Checks must be proportional to the change. Before a release-facing commit:

```bash
npm test
npm run lint
npm run build
```

Contract or deployment changes also require the compile, artifact synchronization,
local Nox, Sepolia E2E, and deployment-verification commands defined during
implementation.

Live evidence must contain public identifiers and lifecycle assertions only.
Confidential plaintext values must be asserted in-memory and redacted from saved
artifacts.

## 8. Phase gates

- Do not start full development until all four feasibility spikes in
  `docs/feasibility-plan.md` pass.
- Do not call a feature complete without the acceptance evidence in
  `docs/verification.md`.
- Do not mark a deployment verified until runtime bytecode and source mapping are
  checked.
- Do not publish submission claims that exceed `docs/threat-model.md`.
