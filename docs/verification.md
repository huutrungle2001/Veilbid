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
| Finalizer | Dry-run, race, budget, health, sanitized logs | PASS — planner/runner/configuration/health tests pass; relay-originated funding confirmation, early close, and proof-finalize writes pass on Sepolia tender #3 |
| MCP read-only | Public queries, strict schemas, no signer/write/reveal | PASS — five stdio tools query finalized tender/readiness/settlement/receipt/ACL state; seven tests and static policy inspection exclude signer, writes, decryption, handles, and raw errors |
| Public index | Rebuild, checkpoint, bounded logs, reorg/failure path | PARTIAL — browser, relay, and MCP share provider-compatible 1,000-block Sepolia RPC pagination; the browser displays latest confirmed events with an explicit 12-block finality boundary while relay/MCP retain finalized indexing; deterministic rebuild/dedupe/guards and live reads pass, with a provider reorg drill still pending |
| Frontend unit | Wallet, forms, roles, URL state, pending/recovery | PASS — 59 tests cover wallet/session clearing, Buyer/Vendor validation, multi-vendor entry, status filtering, latest-confirmed/finality labeling, standalone routes, shared public pagination, public dossiers/receipts, canonical release labeling, recovery, disclosure filters, Auditor ACL-before-decrypt, Safe term binding, atomic Safe batch handoff, and Safe proposal threshold status |
| Responsive/a11y | 1440×1000, 1280×900, 390×844, keyboard, dialogs | PASS — landing/docs/workspaces pass desktop/mobile visual smoke, semantic controls, skip navigation, visible focus, reduced-motion handling, and live regions; production Chrome verified forward/reverse traversal, Enter activation, persistent route state, and hash-target clearance below the sticky header |
| Live Sepolia E2E | Two vendors, valid award, invalid/no-valid refund | PASS — canonical verified release completed a two-vendor Safe award; production invalid/no-valid refund, cancellation, ACL, replay, and Safe paths also pass |
| Source verification | Creation/runtime match and constructor args | PASS — Sourcify exact creation/runtime mappings for every top-level VeilBid contract and Safe, exact embedded-receipt runtime/parent creation mapping, canonical creation bytecode, and current-ABI constructor arguments verified |
| Deployment consistency | Read-only addresses/artifacts/code verification | PASS — full canonical bytecode is tied to Sourcify while local executable logic is compared independently of path-sensitive CBOR metadata; receipts, immutable wiring, Safe configuration, enabled module, and Safe-to-Market operator state pass |
| Dependency security | Production dependency advisory scan | PASS — patched React Router and transitive WebSocket/Hono versions produce zero production advisories; UI and MCP regression suites pass after the updates |
| Secret scan | Repository and evidence clean | PASS — current tracked files, full Git history, and sanitized evidence pass credential-pattern, forbidden-field, local-environment, and history checks; exact counts are recorded in evidence |
| Clean release CI | Fresh checkout compile/test/lint/build/security gates | PASS — GitHub Actions run `30172407364` completed every release check on Ubuntu with pinned Node 24.18.0 and pnpm 10.33.0 |
| Production smoke | Canonical URL and wallet-free reads | PASS — Vercel production routes return 200; desktop/mobile Chrome smoke loaded the persistent shared navigation, active route state, verified release tender #1, award, and receipt without a wallet |

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
pnpm --filter @veilbid/auction-house deploy:safe-factory -- --dry-run
pnpm verify:deployment:release
pnpm test:production https://veilbid-three.vercel.app
pnpm test:keyboard https://veilbid-three.vercel.app
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
| 2026-07-27 | Generic Safe onboarding | `e69eead` | `evidence/sepolia/generic-safe-onboarding.json` | PASS — deterministic per-Safe module, threshold-authorized setup, Safe-owned faucet/wrap, atomic tender creation, dynamic Safe buyer, and preserved owners/threshold |
| 2026-07-27 | iExec Nox Hello World | Working tree | `evidence/sepolia/hackathon-hello-world.json` | PASS — journey wallet deployed the confidential Piggy Bank, submitted encrypted deposit/withdrawal, and decrypted both resulting owner-authorized balances |
| 2026-07-26 | Tender Room public explorer | `a83527e` | Tender Room unit/build checks and live 1440×1000 / 390×844 smoke | PASS — five finalized Sepolia tenders loaded without a wallet; loading/error paths expose no mock fallback or confidential fields |
| 2026-07-26 | Tender Room wallet and writes | `f864a13` | 18 Tender Room tests plus Vite/vinext builds | PARTIAL — explicit EIP-6963 selection, network/account clearing, exactly funded Buyer orchestration, and encrypted Vendor orchestration pass unit/build gates; fresh-wallet browser E2E pending |
| 2026-07-26 | Tender Room Activity recovery | `5afffa9` | 26 Tender Room tests, Vite/vinext builds, and live desktop/mobile smoke | PARTIAL — public-only checkpoints, bounded proof polling, fresh-handle resume, terminal-race cleanup, and close tracking pass unit/build gates; fresh-wallet live recovery remains pending |
| 2026-07-26 | Settlement relay write lifecycle | `90539d0` | `evidence/sepolia/relay-write-e2e.json` | PASS — Safe atomic funding, relay funding confirmation, vendor encrypted bid, relay early close, and relay proof-finalize completed on Sepolia tender #3 |
| 2026-07-26 | Operator Console MCP stdio | `7e06942` | `evidence/sepolia/operator-console-readonly.json` | PASS — five read-only tools completed a real stdio handshake and finalized Sepolia query; strict schemas and static policy exclude signer/write/decryption surfaces |
| 2026-07-26 | Tender Room Auditor flow | `264d604` | 30 Tender Room tests, Vite build, and live 1440×1000 local smoke | PARTIAL — per-bid ACL is checked before decrypt, unauthorized reveal is blocked, and plaintext clears on wallet/session changes; authorized live-wallet reveal remains pending |
| 2026-07-26 | Tender Room Safe Buyer | `9232cbd` | 59 Tender Room tests, Vite build, Safe SDK/API integration | PASS — Safe Buyer is the primary workflow, prepares funding and tender creation atomically, proposes through Safe Transaction Service, shows threshold confirmations, and auto-executes threshold-one Safes |
| 2026-07-26 | Tender Room landing/docs and accessibility | `d44330d` | 35 Tender Room tests, Vite build, 1440×1000 and 390×844 local smoke | PASS — standalone no-RPC landing/docs routes, explicit non-claims, Vercel SPA build contract, skip navigation, visible focus, mobile layouts, and staged live regions verified |
| 2026-07-26 | Selective disclosure and receipt UI | `c9bb374` | 39 Tender Room tests and Vite build | PARTIAL — Vendor/EOA Buyer per-bid grant/reveal controls enforce public role filters, simulate before writes, clear plaintext by session, and surface non-transferable award evidence; fresh-wallet live disclosure remains pending |
| 2026-07-26 | Canonical release preflight | `4a7d1e6` | `evidence/sepolia/release-preflight.json` | PASS — clean synchronized source, untracked environment, exact embedded receipt build input, distinct actors, Sepolia chain, compiled artifacts, and gas-balance thresholds verified without chain writes |
| 2026-07-26 | Canonical release source publication | `1c0d990` | `evidence/sepolia/source-publication.release.json` | PASS — exact Sourcify top-level creation/runtime mappings and embedded receipt runtime/parent creation mapping verified from pinned Standard JSON inputs |
| 2026-07-26 | Canonical release deployment consistency | `edd3c52` | `evidence/sepolia/deployment-consistency.release.json` | PASS — constructor calldata, receipts, runtime bytecode, wiring, Safe/module/operator state, and source mappings verified before `verified=true` promotion |
| 2026-07-26 | Canonical release two-vendor lifecycle | `94bcfc8` | `evidence/sepolia/release-two-vendor.json` | PASS — Safe funding, two distinct encrypted bids, per-vendor ACL/decryption, proof-derived lower second winner, confidential settlement, receipt, replay rejection, threshold cross-bid grant, and preserved release state verified |
| 2026-07-26 | Repository secret scan | `a7afecc` | `evidence/local/secret-scan.json` | PASS — tracked local environment excluded; no private-key assignment, seed/PEM material, provider token, or credential URL pattern found across 206 tracked files |
| 2026-07-26 | Full-history secret scan | `705e16b` | `evidence/local/secret-scan.json` | PASS — ignored environments remain untracked; no credential pattern or historical environment file found across 207 current files and 546 historical blobs |
| 2026-07-26 | Canonical release gate | `0f8b9db` | `evidence/local/release-gate.json` | PASS — all workspace tests, typed lint, compile, Vite/vinext builds, binding/source/deployment checks, verified relay health/dry-run, secret scan, and evidence validation passed |
| 2026-07-26 | Vercel production frontend | `c51c491` | `evidence/sepolia/production-smoke.json` | PASS — deployment `dpl_6Toox8JycbAjM16JU75AbuNgpdcu`, canonical URL, and all SPA routes returned 200; desktop/mobile browser smoke verified the upgraded release, canonical market, awarded tender #1, and wallet-free public state |
| 2026-07-26 | Production keyboard navigation | `f8f1967` | `evidence/sepolia/production-keyboard.json` | PASS — real Chrome Tab/Shift+Tab order, visible focus, skip link, Enter-activated Docs/Evidence routes, persistent header state, and sticky-header hash clearance verified without a wallet |
| 2026-07-26 | Submission release gate | `6b28cdf` | `evidence/local/submission-gate.json` | PASS — full tests/lint/build, verified Sepolia release, Safe wiring, two-vendor lifecycle, relay write lifecycle, secret scan, and evidence validation passed |
| 2026-07-26 | Clean-environment release CI | `5258186` | `evidence/local/release-ci.json` | PASS — fresh full-history checkout completed locked install, contract compile, workspace tests, typed lint, build, binding drift, history secret scan, and evidence validation |
| 2026-07-26 | Public RPC pagination recovery | `5cbf3fe` | `evidence/sepolia/production-smoke.json` | PASS — deployment `dpl_GQ96e7T9v4VasT3F9P1E7wpSTyFW` bounded `eth_getLogs` to 1,000-block ranges; canonical routes returned 200 and Chrome loaded tender #1, award, and receipt without the public-state failure UI |
