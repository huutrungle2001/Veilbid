# VeilBid Verification Plan and Evidence Ledger

> Status: No implementation test has run. Every result starts as `PENDING`.

## 1. Evidence rules

- Store public addresses, hashes, blocks, statuses, and bytecode fingerprints.
- Assert plaintext confidential values only in process memory.
- Redact bid prices, confidential balances, outputs, refunds, handles, proofs,
  signatures, and keys from committed evidence.
- Never mark an unexecuted test as pass.
- Separate deterministic/local simulation from real Nox runtime and Sepolia
  evidence.

## 2. Verification matrix

| Area | Required test/evidence | Status |
|---|---|---|
| Compile and ABI | Pinned toolchain compiles; generated artifacts synchronized | PENDING |
| Persistent handle | Stored bid reused in later transaction with expected ACL | BLOCKED — Docker/Sepolia configuration |
| Encrypted argmin | Valid/invalid/tie/permutation property tests | PARTIAL — 2,000 model cases pass; Nox runtime blocked |
| No plaintext shadow | Source/storage inspection | PASS — feasibility accumulator stores encrypted prices/selection only |
| Close/proof | Winner ID public proof verifies and incorrect proofs fail | BLOCKED — Docker required |
| Proof recovery | Close survives reload/indexing delay and resumes | BLOCKED — Docker required |
| Confidential escrow | Exact winner/remainder/full-refund deltas | BLOCKED — Gate D compiles; Docker required |
| Escrow solvency | Proof-confirmed escrow equals public ceiling | BLOCKED — source behavior identified; runtime proof pending |
| Replay | Duplicate close/finalize/refund cannot settle twice | BLOCKED — Gate C/D checks compile; Docker required |
| Reentrancy | Token callbacks cannot corrupt lifecycle | PENDING |
| Award receipt | Minted once to winner; transfer/approval and callback blocking fail | PENDING |
| Selective ACL | Role/lifecycle/per-handle grants enforced; unrelated account denied | PENDING |
| Safe authority | Preparation cannot execute; threshold-authorized Safe transaction can fund | PENDING |
| Module controls | Safe/action/consumer/nonce binding, replay rejection, and revoke/re-enable | PENDING |
| Finalizer | Dry-run, race, budget, health, sanitized logs | PENDING |
| Public index | Rebuild, checkpoint, bounded logs, reorg/failure path | PENDING |
| Frontend unit | Wallet, forms, roles, URL state, pending/recovery | PENDING |
| Responsive/a11y | 1440×1000, 1280×900, 390×844, keyboard, dialogs | PENDING |
| Live Sepolia E2E | Two vendors, valid award, invalid/no-valid refund | PENDING |
| Source verification | Creation/runtime match and constructor args | PENDING |
| Deployment consistency | Read-only addresses/artifacts/code verification | PENDING |
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
