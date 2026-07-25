# VeilBid Verification Plan and Evidence Ledger

> Status: Feasibility Gates A–E, canonical Sepolia release verification, the
> two-vendor release lifecycle, and production frontend smoke passed.

## 1. Evidence rules

- Store public addresses, hashes, blocks, statuses, and bytecode fingerprints.
- Assert plaintext confidential values only in process memory.
- Redact bid prices, confidential balances, outputs, refunds, handles, proofs,
  signatures, and keys from committed evidence.
- Never mark an unexecuted test as pass.
- Separate deterministic simulation and optional local regression from
  mandatory real Nox runtime evidence on Sepolia.

## 2. Verification matrix

| Area | Required test/evidence | Status |
|---|---|---|
| Compile and ABI | Pinned toolchain compiles; generated artifacts synchronized | PASS — Auction House ABIs, the explicitly unverified test manifest, and the verified canonical release manifest are generated and drift-checked |
| Persistent handle | Stored bid reused in later transaction with expected ACL | PASS — Sepolia blocks 11348541 and 11348543 |
| Encrypted argmin | Valid/invalid/tie/permutation property tests | PASS — six Sepolia cases and 2,000 model cases |
| No plaintext shadow | Source/storage inspection | PASS — feasibility and production market store encrypted prices/selection only |
| Close/proof | Winner ID public proof verifies and incorrect proofs fail | PASS — correct, tampered, and wrong-tender proof paths verified on Sepolia |
| Proof recovery | Close survives reload/indexing delay and resumes | PASS — Sepolia close resumed from a new contract client |
| Confidential escrow | Exact winner/remainder/full-refund deltas | PASS — single and split custody paths verified in memory on Sepolia |
| Escrow solvency | Proof-confirmed escrow equals public ceiling | PASS — exact funding and underfunded rejection verified on Sepolia |
| Replay | Duplicate close/finalize/refund cannot settle twice | PASS — finalize, winner settlement, and refund replay paths rejected on Sepolia |
| Reentrancy | Token callbacks cannot corrupt lifecycle | PARTIAL — all lifecycle writes are guarded and terminal state precedes token calls; callback adversarial runtime test pending |
| Award receipt | Minted once to winner; transfer/approval and callback blocking fail | PASS — proof-derived Sepolia mint plus unit transfer/approval rejection; market uses non-callback mint |
| Selective ACL | Role/lifecycle/per-handle grants enforced; unrelated account denied | PASS — vendor-only Open ACL, post-close EOA buyer grant, and threshold-authorized Safe-to-viewer grant verified |
| Safe authority | Preparation cannot execute; threshold-authorized Safe transaction can fund | PASS — preparation preserved the Safe balance and only a normal Safe transaction funded |
| Module controls | Safe/action/consumer/nonce binding, replay rejection, and revoke/re-enable | PASS — scoped ACL, negative bindings, replay, revoke/re-enable, unchanged authority, and cleanup verified on Sepolia |
| Finalizer | Dry-run, race, budget, health, sanitized logs | PARTIAL — 12 tests cover planning, canonical rereads, sequential shared budget, stale races, sanitized failures, configuration, and health; verified release health/dry-run pass while relay-originated live close/finalize writes remain pending |
| MCP read-only | Public queries, strict schemas, no signer/write/reveal | PASS — five stdio tools query finalized tender/readiness/settlement/receipt/ACL state; seven tests and static policy inspection exclude signer, writes, decryption, handles, and raw errors |
| Public index | Rebuild, checkpoint, bounded logs, reorg/failure path | PARTIAL — deterministic rebuild/dedupe/guards and bounded finalized Sepolia RPC pagination pass; reorg rollback pending |
| Frontend unit | Wallet, forms, roles, URL state, pending/recovery | PARTIAL — 40 tests cover wallet/session clearing, Buyer/Vendor validation, standalone routes, public dossiers/receipts, canonical release labeling, recovery, per-role disclosure filters, Auditor ACL-before-decrypt, and preparation-only Safe term binding; fresh-wallet live browser writes/reveal remain pending |
| Responsive/a11y | 1440×1000, 1280×900, 390×844, keyboard, dialogs | PARTIAL — landing/docs/workspaces pass desktop/mobile visual smoke, semantic controls, skip navigation, visible form/control focus, reduced-motion handling, and live status regions; automated browser keyboard traversal remains pending |
| Live Sepolia E2E | Two vendors, valid award, invalid/no-valid refund | PASS — canonical verified release completed a two-vendor Safe award; production invalid/no-valid refund, cancellation, ACL, replay, and Safe paths also pass |
| Source verification | Creation/runtime match and constructor args | PASS — Sourcify exact creation/runtime mappings for every top-level VeilBid contract and Safe, exact embedded-receipt runtime/parent creation mapping, and locally encoded constructor calldata verified |
| Deployment consistency | Read-only addresses/artifacts/code verification | PASS — canonical release receipts, runtime bytecode, immutable wiring, Safe configuration, enabled module, and Safe-to-Market operator state verified before manifest promotion |
| Secret scan | Repository and evidence clean | PASS — 207 tracked files, 546 historical blobs, and 27 sanitized evidence files pass credential-pattern, forbidden-field, local-environment, and Git-history checks |
| Production smoke | Canonical URL and wallet-free reads | PASS — Vercel production routes return 200; desktop/mobile Chrome smoke loaded verified release tender #1, award, and receipt without a wallet |

## 3. Mandatory contract scenarios

1. First valid bid becomes best.
2. Lower valid bid replaces it.
3. Higher valid bid does not replace it.
4. Equal price keeps earlier bid.
5. Zero bid does not win.
6. Over-ceiling bid does not win.
7. Ninth bid is rejected.
8. Unapproved vendor and duplicate vendor bid are rejected.
9. Bid after deadline is rejected.
10. Close before deadline is rejected.
11. Anyone can close after deadline.
12. Wrong proof/value/tender fails.
13. Nonzero winner maps to the correct stored vendor.
14. Zero winner refunds the full public ceiling.
15. Winner payment plus buyer remainder equals the public ceiling.
16. A closed tender cannot be timeout-refunded while proof is unavailable.
17. Second terminal action fails.
18. Vendor can view its own bid; unrelated accounts and the open-tender buyer
    cannot.
19. Vendor grants affect only its selected bid handle.
20. Buyer grants are rejected while open and accepted per handle after close.
21. A Safe viewer grant requires normal threshold authorization.
22. Buyer cancellation is allowed only under specified pre-bid conditions.
23. Safe preparation cannot execute or spend, and wrong action/consumer/nonce
    or replay fails.
24. Award receipt is minted once to the stored winner, uses no receiver callback,
    and cannot be transferred or approved.

## 4. Property and invariant targets

- Test at least 2,000 deterministic bid sets.
- Randomize bid order, valid/invalid values, ties, ceilings, and bid counts.
- Model expected minimum in test code only; production contract stores no
  plaintext model.
- Assert conservation, terminal-state monotonicity, winner ownership, and
  deterministic ties.

## 5. Live evidence schema

Sanitized JSON may include:

```json
{
  "chainId": 11155111,
  "contracts": {},
  "tenderId": "public-id",
  "transactions": {},
  "blocks": {},
  "statuses": [],
  "assertions": {
    "winnerMatchesProof": true,
    "confidentialConservation": true,
    "unauthorizedRevealRejected": true
  }
}
```

Do not include bid values, balance values, handles, proofs, signatures, or keys.

## 6. Release commands

```bash
pnpm test
pnpm lint
pnpm build
pnpm finalizer:health
pnpm finalizer:dry
pnpm test:ui
pnpm verify:deployment:release
pnpm test:production https://veilbid-three.vercel.app
pnpm secret:scan
pnpm evidence:validate
```

## 7. Evidence ledger

| Date | Environment | Commit | Evidence | Result |
|---|---|---|---|---|
| 2026-07-25 | Local preflight / Gate A compile | `7ae2c48` | `evidence/local/preflight.json`, `evidence/local/gate-a.json` | BLOCKED — official Nox runtime requires Docker; live configuration absent |
| 2026-07-25 | Gate B compile/model | `92f8597` | `evidence/local/gate-b.json` | PARTIAL — 2,000 model cases pass; encrypted runtime blocked on Docker |
| 2026-07-25 | Gate C compile | `2411e5e` | `evidence/local/gate-c.json` | BLOCKED — proof and recovery runtime requires Docker |
| 2026-07-25 | Gate D compile/source inspection | `d9c97ce` | `evidence/local/gate-d.json` | BLOCKED — official wrapper paths compile; confidential runtime assertions require Docker |
| 2026-07-25 | Gate A Ethereum Sepolia | `229afee` | `evidence/sepolia/gate-a.json` | PASS — cross-block reuse, persistent ACL, vendor decrypt, and encrypted comparison verified |
| 2026-07-25 | Gate B Ethereum Sepolia | `4f32508` | `evidence/sepolia/gate-b.json` | PASS — six representative encrypted cases and 2,000 deterministic model cases |
| 2026-07-25 | Gate C Ethereum Sepolia | `1b27797` | `evidence/sepolia/gate-c.json` | PASS — public proof, tamper/tender binding, reload recovery, winner mapping, and replay verified |
| 2026-07-25 | Gate D Ethereum Sepolia | `576ee7a` | `evidence/sepolia/gate-d.json` | PASS — official wrapper, exact funding, underfund rejection, settlement/refund, cross-contract ACL, conservation, and replay verified |
| 2026-07-25 | Gate E compile/static inspection | `7df3ff7` | `evidence/local/gate-e.json` | PASS — module and consumer compile; module ABI has no Safe execution surface |
| 2026-07-25 | Gate E Safe deployment | `10e9b25` | `evidence/sepolia/gate-e-safe.json` | PASS — separate Safe v1.4.1 owner and threshold verified |
| 2026-07-25 | Gate E Safe authority | `a3cc1db` | `evidence/sepolia/gate-e.json` | PASS — threshold funding, scoped preparation, negative bindings, replay guards, revoke/re-enable, preserved authority, and cleanup verified |
| 2026-07-25 | Production market EOA lifecycle | `a7413b0` | `evidence/sepolia/market-eoa.json` | PASS — exact funding, admission/replay/deadline, scoped ACL, winner-only proof, confidential settlement, award receipt, and post-close buyer reveal verified |
| 2026-07-25 | Production refund/cancellation lifecycle | `7aa859b` | `evidence/sepolia/market-refund.json` | PASS — encrypted invalid bid, proof-derived zero winner, full refund, cancellation boundaries, conservation, and replay guards verified |
| 2026-07-25 | Production Safe lifecycle | `00a19a3` | `evidence/sepolia/market-safe.json` | PASS — full-term preparation binding, normal Safe create/fund/cancel, exact funding proof, replay rejection, preserved authority, and cleanup verified |
| 2026-07-26 | Production properties/adversarial guards | `5eb30d8` | Auction House property/static tests | PASS — 10,000 bid sets, deterministic ties, lifecycle monotonicity, conservation, Nox operation order, admission bounds, reentrancy/CEI, and forbidden escape surfaces |
| 2026-07-26 | E2E deployment consistency | `0f2b309` | `evidence/sepolia/deployment-consistency.test.json` | PASS — receipts, masked-immutable runtime bytecode, immutable wiring, Safe configuration, and cleanup state verified; manifest remains explicitly unverified |
| 2026-07-26 | Production Safe viewer authority | `ca5bc69` | `evidence/sepolia/market-safe-viewer.json` | PASS — Safe-owned award, Open-state denial, proof-derived settlement, direct-owner denial, threshold viewer grant/decryption, preserved authority, and cleanup verified |
| 2026-07-26 | Tender Room public explorer | `a83527e` | Tender Room unit/build checks and live 1440×1000 / 390×844 smoke | PASS — five finalized Sepolia tenders loaded without a wallet; loading/error paths expose no mock fallback or confidential fields |
| 2026-07-26 | Tender Room wallet and writes | `f864a13` | 18 Tender Room tests plus Vite/vinext builds | PARTIAL — explicit EIP-6963 selection, network/account clearing, exactly funded Buyer orchestration, and encrypted Vendor orchestration pass unit/build gates; fresh-wallet browser E2E pending |
| 2026-07-26 | Tender Room Activity recovery | `5afffa9` | 26 Tender Room tests, Vite/vinext builds, and live desktop/mobile smoke | PARTIAL — public-only checkpoints, bounded proof polling, fresh-handle resume, terminal-race cleanup, and close tracking pass unit/build gates; fresh-wallet live recovery remains pending |
| 2026-07-26 | Settlement relay read-only smoke | `fb49742` | `evidence/sepolia/finalizer-readonly.json` | PARTIAL — Sepolia health and zero-action dry-run pass; 12 tests cover budget/race/log boundaries; live close/finalize writes remain pending |
| 2026-07-26 | Operator Console MCP stdio | `7e06942` | `evidence/sepolia/operator-console-readonly.json` | PASS — five read-only tools completed a real stdio handshake and finalized Sepolia query; strict schemas and static policy exclude signer/write/decryption surfaces |
| 2026-07-26 | Tender Room Auditor flow | `264d604` | 30 Tender Room tests, Vite build, and live 1440×1000 local smoke | PARTIAL — per-bid ACL is checked before decrypt, unauthorized reveal is blocked, and plaintext clears on wallet/session changes; authorized live-wallet reveal remains pending |
| 2026-07-26 | Tender Room Safe Treasury | `e96586a` | 33 Tender Room tests, Vite build, and live 1440×1000 local smoke | PARTIAL — full terms/consumer/nonce feed the preparation-only module and session calldata targets normal Safe authorization; the current disabled E2E module prevents a fresh live preparation run |
| 2026-07-26 | Tender Room landing/docs and accessibility | `d44330d` | 35 Tender Room tests, Vite build, 1440×1000 and 390×844 local smoke | PASS — standalone no-RPC landing/docs routes, explicit non-claims, Vercel SPA build contract, skip navigation, visible focus, mobile layouts, and staged live regions verified |
| 2026-07-26 | Selective disclosure and receipt UI | `c9bb374` | 39 Tender Room tests and Vite build | PARTIAL — Vendor/EOA Buyer per-bid grant/reveal controls enforce public role filters, simulate before writes, clear plaintext by session, and surface non-transferable award evidence; fresh-wallet live disclosure remains pending |
| 2026-07-26 | Canonical release preflight | `4a7d1e6` | `evidence/sepolia/release-preflight.json` | PASS — clean synchronized source, untracked environment, exact embedded receipt build input, distinct actors, Sepolia chain, compiled artifacts, and gas-balance thresholds verified without chain writes |
| 2026-07-26 | Canonical release source publication | `1c0d990` | `evidence/sepolia/source-publication.release.json` | PASS — exact Sourcify top-level creation/runtime mappings and embedded receipt runtime/parent creation mapping verified from pinned Standard JSON inputs |
| 2026-07-26 | Canonical release deployment consistency | `edd3c52` | `evidence/sepolia/deployment-consistency.release.json` | PASS — constructor calldata, receipts, runtime bytecode, wiring, Safe/module/operator state, and source mappings verified before `verified=true` promotion |
| 2026-07-26 | Canonical release two-vendor lifecycle | `94bcfc8` | `evidence/sepolia/release-two-vendor.json` | PASS — Safe funding, two distinct encrypted bids, per-vendor ACL/decryption, proof-derived lower second winner, confidential settlement, receipt, replay rejection, threshold cross-bid grant, and preserved release state verified |
| 2026-07-26 | Repository secret scan | `a7afecc` | `evidence/local/secret-scan.json` | PASS — tracked local environment excluded; no private-key assignment, seed/PEM material, provider token, or credential URL pattern found across 206 tracked files |
| 2026-07-26 | Full-history secret scan | `705e16b` | `evidence/local/secret-scan.json` | PASS — ignored environments remain untracked; no credential pattern or historical environment file found across 207 current files and 546 historical blobs |
| 2026-07-26 | Canonical release gate | `0f8b9db` | `evidence/local/release-gate.json` | PASS — all workspace tests, typed lint, compile, Vite/vinext builds, binding/source/deployment checks, verified relay health/dry-run, secret scan, and evidence validation passed |
| 2026-07-26 | Vercel production frontend | `83fb374` | `evidence/sepolia/production-smoke.json` | PASS — canonical URL and all SPA routes returned 200; 1440×1000 and 390×844 browser smoke loaded verified release tender #1, award, and receipt wallet-free |
