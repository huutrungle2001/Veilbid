# VeilBid Build Plan

> Status: Approved on 2026-07-25. Production implementation is in progress
> after all feasibility gates and the Safe design passed.

## 1. Product profile

- Client: React, Vite, React Router, responsive CSS.
- Wallet/contracts: ethers v6 and explicit EIP-6963 provider selection.
- Confidential client: `@iexec-nox/handle`.
- Contracts: Solidity 0.8.35, Hardhat 3, Node 24.
- Confidential assets: official ERC-7984 wrapper.
- Smart account: Safe v1.4.1 deployed through
  `@safe-global/protocol-kit@8.0.4` and a VeilBid preparation-only module.
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
- [ ] Verify deadline, timezone, and official submission steps.

### Milestone 1 — Feasibility scaffold

- [x] Initialize the root tooling and isolated `feasibility` workspace only.
- [x] Install pinned Nox/Hardhat dependencies.
- [x] Implement and verify persistent-handle spike on Sepolia.
- [x] Implement and verify encrypted argmin spike on Sepolia.
- [x] Implement and verify public winner proof/recovery spike on Sepolia.
- [x] Implement and verify single/split escrow settlement spikes on Sepolia.
- [x] Record sanitized evidence and select internal market custody.

Exit: Gates A–D pass.

Production workspaces are not created during this milestone. Gate outputs record
the versions and architecture that the later `auction-house` implementation must
use.

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
- [x] Support owner handle preparation and threshold-authorized Safe funding.
- [ ] Support buyer cancellation/viewer operations where approved.
- [x] Test revoke/re-enable and permissionless terminal actions.
- [x] Document threshold-1 browser limitations.

Exit: Safe owns funds, module calls cannot execute from the Safe, and every
funding/viewer write satisfies normal Safe threshold authority.

Gate E established the implementation basis for the first three items and the
revoke/re-enable path on Sepolia. These checkboxes remain open until the
equivalent production contracts and tests exist outside `feasibility/`.

### Milestone 4 — Web product

- [ ] Build standalone landing and docs.
- [ ] Implement wallet-free tender explorer and detail routes.
- [ ] Implement Buyer and Vendor flows.
- [ ] Implement Activity proof recovery.
- [ ] Implement Auditor viewer/reveal flow.
- [ ] Implement Safe Treasury workspace.
- [ ] Add provider-aware reconnect, keyboard behavior, mobile layout, and staged
  progress/result notifications.

Exit: Fresh-wallet core journey is discoverable and responsive.

### Milestone 5 — Automation and integrations

- [ ] Implement event-derived tender index with finalized checkpoint.
- [ ] Build stateless finalizer dry-run/once/poll/health.
- [ ] Add race simulation and bounded action budget.
- [ ] Add optional read-only MCP tools.
- [ ] Add optional strict-schema public-term draft assistant only if core release
  is already stable.

Exit: Public lifecycle remains live without private authority.

### Milestone 6 — Sepolia deployment and verification

- [ ] Deploy test token, wrapper, internal-custody market, receipt, Safe, and
  module.
- [ ] Synchronize canonical artifacts to client.
- [ ] Run two-vendor live lifecycle.
- [ ] Run invalid bid, tie, no-valid-bid, cancel, timeout, replay, ACL, and Safe
  flows.
- [ ] Publish exact source mapping and verify runtime bytecode.
- [ ] Deploy public frontend and smoke desktop/mobile.

Exit: `npm test`, `npm run lint`, `npm run build`, live E2E, and deployment
verification pass.

### Milestone 7 — Submission

- [ ] Replace feedback placeholder with implementation evidence.
- [ ] Finalize README, docs, threat model, and verification report.
- [ ] Record a real-person demo under four minutes.
- [ ] Publish public GitHub repository.
- [ ] Publish X post with required links and `@iEx_ec`.
- [ ] Submit the independent VeilBid project on DoraHacks.
- [ ] Complete final privacy/secret/claim review.

## 4. Planned commands

Names are reserved and become real only after workspace scaffolding:

```bash
npm install
npm run compile
npm test
npm run test:nox
npm run test:sepolia
npm run test:safe:sepolia
npm run finalizer:dry
npm run test:mcp
npm run test:unit
npm run test:ui
npm run lint
npm run build
npm run verify:deployment
```

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
