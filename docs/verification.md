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
| Persistent handle | Stored bid reused in later transaction with expected ACL | PENDING |
| Encrypted argmin | Valid/invalid/tie/permutation property tests | PENDING |
| No plaintext shadow | Source/storage inspection | PENDING |
| Close/proof | Winner ID public proof verifies and incorrect proofs fail | PENDING |
| Proof recovery | Close survives reload/indexing delay and resumes | PENDING |
| Confidential escrow | Exact winner/remainder/full-refund deltas | PENDING |
| Replay | Duplicate close/finalize/refund cannot settle twice | PENDING |
| Reentrancy | Token/receipt callbacks cannot corrupt lifecycle | PENDING |
| Selective ACL | Vendor/buyer/auditor allowed; unrelated account denied | PENDING |
| Safe authority | Preparation cannot spend; Safe authorization can | PENDING |
| Module controls | Target/token/selector restrictions and revoke/re-enable | PENDING |
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
8. Bid after deadline is rejected.
9. Close before deadline is rejected.
10. Anyone can close after deadline.
11. Wrong proof/value/tender fails.
12. Nonzero winner maps to the correct stored vendor.
13. Zero winner refunds full budget.
14. Winner payment plus buyer remainder equals budget.
15. Second terminal action fails.
16. Unauthorized viewer cannot decrypt.
17. Buyer cancellation is allowed only under specified pre-bid conditions.
18. Safe module cannot call an unapproved target/selector/token.

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
|  |  |  |  |  |

