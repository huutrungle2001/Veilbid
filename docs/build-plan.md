# VeilBid Build Plan

> Status: Implemented. Release engineering, deployment, verification, and
> public repository packaging are complete.

## 1. Product profile

- Client: React, Vite, React Router, responsive CSS.
- Wallet/contracts: viem 2.47.6 and explicit EIP-6963 provider selection.
- Confidential client: `@iexec-nox/handle`.
- Contracts: Solidity 0.8.35, Hardhat 3, Node 24.
- Confidential assets: official ERC-7984 wrapper.
- Smart account: Safe v1.4.1 deployed through
  `@safe-global/protocol-kit@8.0.4`, Safe Transaction Service integration, and a
  VeilBid preparation module with a Safe-only atomic entrypoint.
- Automation: stateless Node finalizer.
- Optional integration: MCP stdio, read-only by default.
- Data model: chain events plus rebuildable local caches; no database.

Pinned implementation versions:

- `@iexec-nox/nox-protocol-contracts@0.2.4`
- `@iexec-nox/nox-confidential-contracts@0.2.2`
- `@iexec-nox/handle@0.1.0-beta.13`
- `@safe-global/protocol-kit@8.0.4`
- `hardhat@3.11.1`
- `solc@0.8.35`
- `node@24.18.0`
- `pnpm@10.33.0`

Transitive versions remain frozen by `pnpm-lock.yaml`.

## 2. Release architecture depth

VeilBid reaches its required architecture depth only when the release contains:

- Real Nox encrypted business computation, not encryption-only storage.
- Real ERC-7984 custody and settlement.
- Personal and Safe-owned paths with distinct authority.
- Multi-stage public proof recovery.
- Permissionless lifecycle automation.
- Selective ACL disclosure.
- Event-derived public explorer.
- Receipt/evidence layer.
- Generated ABI/address synchronization.
- Unit, invariant, deterministic model, live Sepolia, UI, deployment
  verification, and optional local Nox regression.
- Accurate threat model, feedback, docs, and submission materials.

Agent/MCP features do not compensate for a missing core protocol flow.

## 3. Milestones

### Milestone 0 — Workspace and approval

- [x] Create independent canonical documentation.
- [x] Capture original source inputs and source priority.
- [x] User approves Product Plan.
- [x] Record the submission requirements used for the release.

### Milestone 1 — Feasibility scaffold

- [x] Initialize root tooling and the then-isolated feasibility workspace.
- [x] Install pinned Nox/Hardhat dependencies.
- [x] Implement and verify persistent-handle spike on Sepolia.
- [x] Implement and verify encrypted argmin spike on Sepolia.
- [x] Implement and verify public winner proof/recovery spike on Sepolia.
- [x] Implement and verify single/split escrow settlement spikes on Sepolia.
- [x] Record sanitized evidence and select internal market custody.

Exit: Gates A–D pass.

Production workspaces were not created during this milestone. Gate outputs
recorded the versions and architecture later used by the production Auction
House. The retained spike sources and tests now live under the isolated
feasibility subtrees in `packages/contracts`.

### Milestone 2 — Core contracts

- [x] Implement test asset and official wrapper extension.
- [x] Implement market/tender lifecycle.
- [x] Implement encrypted bid validation and accumulator.
- [x] Implement close/finalize/refund and replay protection.
- [x] Implement confidential payout/refund.
- [x] Implement selective ACL and award receipt.
- [x] Add unit, property, invariant, and adversarial tests.

Exit: Core protocol tests pass without plaintext shadow state.

### Milestone 3 — Safe composability

- [x] Deploy a new local/Sepolia Safe for VeilBid.
- [x] Implement a preparation-only module with strict
  Safe/action/consumer/nonce binding and no Safe execution entry point.
- [x] Make Safe Buyer the primary browser workflow with one atomic batch for
  handle preparation and tender creation; retain EOA recovery fallback.
- [x] Support connected-wallet deposits to a Safe plus threshold-authorized
  confidential tender funding.
- [x] Support threshold-authorized full and custom Safe vcUSDC unwrap through a
  custody-free, transaction-scoped preparation adapter.
- [x] Support buyer cancellation/viewer operations where approved.
- [x] Test revoke/re-enable and permissionless terminal actions.
- [x] Document threshold-1 browser limitations.

Exit: Safe owns funds, wallet deposits cannot spend them, module calls cannot
execute from the Safe, and every tender-funding/viewer write satisfies normal
Safe threshold authority.

Gate E established the implementation basis for the first three items and the
revoke/re-enable path on Sepolia. These checkboxes remain open until the
equivalent production contracts and tests remain separate from
`packages/contracts/contracts/feasibility/`.

### Milestone 4 — Web product

- [x] Build standalone landing and docs.
- [x] Implement wallet-free tender explorer and detail routes.
- [x] Implement first-class Safe Buyer, EOA Buyer, Private Bids, and Activity flows.
- [x] Implement Activity proof recovery.
- [x] Merge post-finalization review and Vendor disclosure into Private Bids.
- [x] Implement Safe Buyer workspace with Safe Transaction Service proposal,
  threshold status, and automatic execution for threshold-one Safes.
- [x] Add provider-aware reconnect, keyboard behavior, mobile layout, and staged
  progress/result notifications.

Exit: Fresh-wallet core journey is discoverable and responsive.

### Milestone 5 — Automation and integrations

- [x] Implement event-derived tender index with finalized checkpoint.
- [x] Build stateless finalizer dry-run/once/poll/health.
- [x] Add race simulation and bounded action budget.
- [x] Add optional read-only MCP tools.
- [ ] Add optional strict-schema public-term draft assistant only if core release
  is already stable.

Exit: Public lifecycle remains live without private authority.

### Milestone 6 — Sepolia deployment and verification

- [x] Deploy test token, wrapper, internal-custody market, receipt, Safe, and
  module.
- [x] Synchronize canonical artifacts to client.
- [x] Run two-vendor live lifecycle.
- [x] Run invalid bid, tie, no-valid-bid, cancel, timeout, replay, ACL, and Safe
  flows.
- [x] Publish exact source mapping and verify runtime bytecode.
- [x] Deploy public frontend and smoke desktop/mobile.

Exit: `npm test`, `npm run lint`, `npm run build`, live E2E, and deployment
verification pass.

### Milestone 7 — Submission

- [x] Replace feedback placeholder with implementation evidence.
- [x] Finalize README, docs, threat model, and verification report.
- [x] Record and prepare a real-person demo under four minutes.
- [x] Publish the public GitHub repository.
- [x] Prepare the external announcement and submission metadata.
- [x] Package the independent VeilBid project for external submission.
- [x] Complete final privacy/secret/claim review.

## 4. Commands

```bash
pnpm install --frozen-lockfile
pnpm compile
pnpm test
pnpm lint
pnpm build
pnpm bindings:check
pnpm finalizer:health
pnpm finalizer:dry
pnpm verify:deployment:release
pnpm test:production https://veilbid-three.vercel.app
pnpm test:keyboard https://veilbid-three.vercel.app
```

Write-enabled Sepolia suites are individually named in root `package.json` and
require ignored local test-wallet configuration.

## 5. Scope-control rules

- Stop full build if a mandatory feasibility kill condition occurs.
- Use the selected internal-custody market; do not reintroduce split escrow
  without new evidence that justifies its additional ACL/call surface.
- Do not add multi-criteria scoring until price-only settlement is verified.
- Do not add AI or MCP writes before the live core lifecycle passes.
- Do not add a backend/database to solve event-index or proof-recovery problems.
- Preserve at least one full day for deployment evidence and submission.

## 6. Release gate

Core Product Ready requires:

- All Must-have acceptance criteria.
- No mock data on the judge path.
- No secrets or plaintext bids in evidence.
- Accurate public/private boundary in UI and docs.
- Live Sepolia EOA and Safe flows.
- Recoverable public proof finalization.
- Complete source/deployment synchronization.
