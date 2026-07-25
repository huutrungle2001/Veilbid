# VeilBid Verification Plan and Evidence Ledger

> Status: Feasibility Gates A–E passed on Ethereum Sepolia. Production
> implementation and release verification remain pending.

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
| Compile and ABI | Pinned toolchain compiles; generated artifacts synchronized | PASS — Auction House ABIs and the explicitly unverified test address manifest are generated and drift-checked |
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
| Finalizer | Dry-run, race, budget, health, sanitized logs | PENDING |
| Public index | Rebuild, checkpoint, bounded logs, reorg/failure path | PARTIAL — deterministic rebuild/dedupe/guards and bounded finalized Sepolia RPC pagination pass; reorg rollback pending |
| Frontend unit | Wallet, forms, roles, URL state, pending/recovery | PARTIAL — wallet-free finalized-log explorer, URL-selected dossier, loading/empty/failure states, and no-fallback guard pass; wallet and write flows pending |
| Responsive/a11y | 1440×1000, 1280×900, 390×844, keyboard, dialogs | PARTIAL — live 1440×1000 and 390×844 visual smoke plus semantic controls pass; full keyboard/dialog audit pending |
| Live Sepolia E2E | Two vendors, valid award, invalid/no-valid refund | PARTIAL — production award, invalid/no-valid refund, cancellation, and Safe paths pass; two-vendor production run pending |
| Source verification | Creation/runtime match and constructor args | PARTIAL — E2E runtime matches compiled artifacts with immutable getters verified; explorer publication pending |
| Deployment consistency | Read-only addresses/artifacts/code verification | PARTIAL — E2E test manifest passes receipts, runtime, wiring, Safe, and cleanup checks; release manifest pending |
| Secret scan | Repository and evidence clean | PENDING |
| Production smoke | Canonical URL and wallet-free reads | PENDING |

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

Populate exact commands after scaffolding. The release gate will include:

```bash
npm test
npm run lint
npm run build
npm run finalizer:dry
npm run test:ui
npm run test:sepolia
npm run test:safe:sepolia
npm run verify:deployment
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
