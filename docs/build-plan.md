# VeilBid Build Plan

> Status: Draft. Development starts only after Product Plan approval and
> mandatory feasibility gates.

## 1. Product profile

- Client: React, Vite, React Router, responsive CSS.
- Wallet/contracts: ethers v6 and explicit EIP-6963 provider selection.
- Confidential client: `@iexec-nox/handle`.
- Contracts: Solidity 0.8.35, Hardhat 3, Node 24.
- Confidential assets: official ERC-7984 wrapper.
- Smart account: Safe v1.4.1-compatible deployment and restricted module.
- Automation: stateless Node finalizer.
- Optional integration: MCP stdio, read-only by default.
- Data model: chain events plus rebuildable local caches; no database.

Pin exact versions after the feasibility scaffold installs successfully.

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
- Unit, invariant, local Nox, live Sepolia, UI, and deployment verification.
- Accurate threat model, feedback, docs, and submission materials.

Agent/MCP features do not compensate for a missing core protocol flow.

## 3. Milestones

### Milestone 0 — Workspace and approval

- [x] Create independent canonical documentation.
- [x] Capture original source inputs and source priority.
- [ ] User approves Product Plan.
- [ ] Verify deadline, timezone, and official submission steps.

### Milestone 1 — Feasibility scaffold

- [ ] Initialize npm workspaces and supported runtime checks.
- [ ] Install pinned Nox/Hardhat/ethers dependencies.
- [ ] Implement persistent-handle spike.
- [ ] Implement encrypted argmin spike.
- [ ] Implement public winner proof/recovery spike.
- [ ] Implement single/split escrow settlement spikes.
- [ ] Record exact evidence and select architecture.

Exit: Gates A–D pass.

### Milestone 2 — Core contracts

- [ ] Implement test asset and official wrapper extension.
- [ ] Implement market/tender lifecycle.
- [ ] Implement encrypted bid validation and accumulator.
- [ ] Implement close/finalize/refund and replay protection.
- [ ] Implement confidential payout/refund.
- [ ] Implement selective ACL and award receipt.
- [ ] Add unit, property, invariant, and adversarial tests.

Exit: Core protocol tests pass without plaintext shadow state.

### Milestone 3 — Safe composability

- [ ] Deploy a new local/Sepolia Safe for VeilBid.
- [ ] Implement strict token/target/selector/consumer allowlists.
- [ ] Support owner handle preparation and Safe-authorized funding.
- [ ] Support buyer cancellation/viewer operations where approved.
- [ ] Test revoke/re-enable and permissionless terminal actions.
- [ ] Document threshold-1 browser limitations.

Exit: Safe owns funds and no module call bypasses Safe authority.

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

- [ ] Deploy test token, wrapper, market/escrow, receipt, Safe, and module.
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
- Prefer a single market/escrow contract if split ACL is unreliable.
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
