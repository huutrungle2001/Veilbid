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
2. `docs/user-guide.md`
3. `docs/deployment.md`
4. `docs/product-plan.md`
5. `docs/feasibility-plan.md`
6. `docs/build-plan.md`
7. `docs/architecture.md`
8. `docs/contract-spec.md`
9. `docs/threat-model.md`
10. `docs/verification.md`
11. `docs/repository-layout.md`
12. `DESIGNS.md` for user-interface changes.

## 3. Source priority

Use this priority order for release facts:

1. `packages/contracts/deployments/sepolia.release.json`.
2. Generated release bindings under `packages/chain-bindings/generated/`.
3. Sanitized verification output under `evidence/`.
4. Production source and tests.
5. Canonical product and security documentation.
6. README summaries.
7. Agent inference.

When documentation conflicts with the verified release manifest or generated
bindings, stop using the conflicting claim and synchronize every public-facing
reference before committing.

## 4. Repository map

VeilBid uses a compact monorepo layout:

- `apps/web/`: landing page and Public, Safe Buyer, EOA Buyer, Private Bids,
  Activity, and Safe Treasury interface.
- `apps/relay/`: stateless close, public-decryption, finalize, and refund
  automation.
- `apps/console/`: MCP stdio tools and local procurement CLI; read-only by
  default.
- `packages/contracts/`: the shared Hardhat/Nox workspace. Production VeilBid
  Market contracts remain separate from isolated feasibility contracts and
  tests inside this package.
- `packages/chain-bindings/`: generated ABI/address snapshots, event codecs,
  public index, and domain types.
- `tooling/scripts/`: repository preflight, evidence validation, and secret
  scanning.
- `evidence/`: sanitized schemas and public local/Sepolia verification output.
- `docs/`: user, deployment, product, architecture, contract, threat-model, and
  verification documentation.

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
- Review access is per-handle and does not imply token operator, Safe signer, or
  protocol administration authority. The creation-bound review wallet receives
  stored-bid access only after finalization.
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
- Update the relevant canonical document when release status, architecture,
  deployment, security boundaries, or verification evidence changes.
- After completing and validating a requested change, create one or more small,
  logically scoped Git commits by default. Do not commit only when the user
  explicitly asks to leave the work uncommitted.

## 7. Validation

Checks must be proportional to the change. Before a release-facing commit:

```bash
npm test
npm run lint
npm run build
```

For simple documentation, copy, spacing, or presentation-only changes that do
not alter data flow, state, contract calls, generated bindings, or security
boundaries, a focused diff/format check and direct visual inspection are
sufficient unless the user requests broader validation. Do not run the full
test suite mechanically for those changes.

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
