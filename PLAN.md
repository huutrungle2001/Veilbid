# VeilBid Master Plan

> This file coordinates progress. Requirements and rubric details remain
> canonical in `docs/`.

## 1. Current status

- Current phase: Phase 7 — Submission
- Status: Waiting for approval
- Next action: Record the demo video, publish the X post, and complete the
  DoraHacks submission using the verified production release.
- Current blocker: Product engineering is complete; submission media and final
  publication remain user-controlled. Previous releases remain recoverable
  from GitHub and local branch `backup/pre-auto-review-20260727`.
- Awaiting approval from: User for final submission media/publication.
- Last updated: 2026-07-28T20:28:00+07:00

Allowed statuses: `Todo`, `In progress`, `Waiting for approval`, `Blocked`,
`Completed`, and `Skipped`.

## 2. Canonical sources

| Content | Canonical file |
|---|---|
| Competition overview | `docs/competition-summary.md` |
| Requirements and eligibility | `docs/requirements.md` |
| Rubric | `docs/judging-criteria.md` |
| Sources, deadline, conflicts | `docs/important-notes.md` |
| Research and technical context | `docs/research-plan.md` |
| Idea selection | `docs/idea-selection.md` |
| Product scope | `docs/product-plan.md` |
| Technical feasibility | `docs/feasibility-plan.md` |
| Architecture | `docs/architecture.md` |
| Repository layout | `docs/repository-layout.md` |
| Contract behavior | `docs/contract-spec.md` |
| Security boundaries | `docs/threat-model.md` |
| Verification evidence | `docs/verification.md` |

## 3. Execution plan

| Phase | Work | Approval gate | Status |
|---|---|---|---|
| 0. Workspace handoff | Establish canonical documents, sources, and repository rules | User reviews handoff | Completed |
| 1. Context and problem validation | Confirm competition facts, user pain, technical inputs, and product value | Decision-ready context | Completed |
| 2. Product definition | Approve MVP, non-goals, acceptance criteria, and demo story | User approves Product Plan | Completed |
| 3. Feasibility spikes | Prove handle persistence, encrypted argmin, public winner proof, and confidential settlement | All four mandatory gates pass | Completed |
| 4. Build design | Freeze stack, contract interfaces, privacy model, milestones, and evidence schema | User approves Build Plan | Completed |
| 5. Core development | Implement contracts, tests, generated artifacts, and local client | Core Product Ready gate | Completed |
| 6. Sepolia and product | Deploy contracts, complete web/finalizer/MCP, verify live flows | Generic Safe release verification passes | Completed |
| 7. Submission | Publish repository, feedback, live UI, and DoraHacks entry | User final review | Waiting for approval |
| 8. Post-hackathon Safe multisig | Support multi-owner Safe treasuries, configurable thresholds, signer UX, and full lifecycle regression coverage | Multi-owner Sepolia acceptance flow passes | Todo |

Only one phase may be `In progress`.

## 4. Approval log

| Gate | Decision | Confirmed by | Date | Notes |
|---|---|---|---|---|
| Multiple submissions | Approved | User | 2026-07-25 | Organizer permission was confirmed by the user. |
| Product direction | Approved in principle | User | 2026-07-25 | VeilBid confidential procurement selected for detailed planning. |
| Workspace creation | Approved | User | 2026-07-25 | Independent workspace and Git repository requested. |
| Product Plan | Approved | User | 2026-07-25 | Approved with fixed vendor admission, funded-ceiling escrow, preparation-only Safe module, post-close per-handle buyer ACL, no timeout refund after close, and a non-transferable winner receipt. |
| Sepolia-first feasibility | Approved | User | 2026-07-25 | Mandatory runtime evidence moves to Ethereum Sepolia; local Docker/Nox becomes optional regression coverage. |
| Feasibility gate | Approved | User | 2026-07-25 | Gates A–D passed; internal market custody selected and exact-funding proof added to the lifecycle. |
| Build Plan | Approved | User | 2026-07-25 | User requested continued implementation after the Safe design passed its Sepolia authority gate. |
| Frontend hosting | Vercel approved | User | 2026-07-26 | Future frontend deployments use the installed Vercel CLI; the earlier private preview is not the canonical release deployment. |
| Frontend release | Verified | Agent | 2026-07-26 | Vercel production URL `https://veilbid-three.vercel.app` passed wallet-free desktop/mobile smoke plus real-browser forward/reverse keyboard traversal, including persistent navigation and active route state, against the canonical release. |
| Final web polish | Verified | Agent | 2026-07-26 | Production deployment `dpl_Bnk6pMbKkFtCgSHc3qskL8BSjfxz` added explicit multi-wallet selection, unified Docs navigation, sticky documentation sections, expanded usage guidance, responsive landing content, and a zero-failure 176-element Docs contrast audit. |
| Tender navigation correction | Verified | Agent | 2026-07-26 | Production deployment `dpl_DbuNsxKGhJ96Yc3ER1J1nyZRyLHo` keeps Tender workspaces in a sticky left sidebar on desktop and a sticky horizontal rail on mobile; the public-metadata badge now has explicit black-on-white contrast. |
| Repository consolidation | Verified | Agent | 2026-07-26 | Applications moved under `apps/`, reusable workspaces under `packages/`, and repository scripts under `tooling/`; production and feasibility Solidity now share one pinned contracts workspace with separate deployment boundaries. |
| Public repository | Published | User | 2026-07-26 | `https://github.com/huutrungle2001/Veilbid` was changed from private to public after the user requested continuation. |
| Public RPC pagination recovery | Verified | Agent | 2026-07-26 | Deployment `dpl_GQ96e7T9v4VasT3F9P1E7wpSTyFW` limits inclusive `eth_getLogs` ranges to 1,000 blocks, restores wallet-free tender #1, and passes production desktop/mobile smoke without the unavailable-state fallback. |
| Settlement relay live writes | Verified | Agent | 2026-07-26 | Canonical release tender #5 completed Safe funding, encrypted vendor bidding, relay-account close, public-proof finalize, and proof-derived award on Sepolia; disposable failed setup tenders #3/#4 were cancelled and escrow returned to the Safe. |
| Safe Buyer atomic workflow | Verified | Agent | 2026-07-27 | Safe Buyer now proposes one atomic preparation/create batch through Safe Transaction Service, displays threshold confirmations, and auto-executes threshold-one Safes; EOA confirmation remains an advanced fallback. |
| Early close and funding relay | Verified | Agent | 2026-07-27 | Approved-vendor completion closes tenders before the deadline; the stateless relay confirms funding, closes, and finalizes without a database. |
| Render settlement relay | Deployed | Agent | 2026-07-27 | Free web service `https://veilbid-settlement-relay.onrender.com` runs `node apps/relay/dist/cli.js poll` with `/live` liveness and `/health` chain readiness; free-tier sleep/restart remains an operational limitation. |
| Upgraded frontend release | Verified | Agent | 2026-07-27 | Vercel deployment `dpl_6Toox8JycbAjM16JU75AbuNgpdcu` is aliased to `https://veilbid-three.vercel.app` and passed wallet-free desktop/mobile production smoke against the new canonical market. |
| GitHub Actions relay | Verified | Agent | 2026-07-27 | Workflow `.github/workflows/settlement-relay.yml` runs one stateless Sepolia cycle every five minutes with repository secrets, concurrency protection, manual dispatch, and successful run `30218254852`. |
| Railway settlement relay | Verified | Agent | 2026-07-27 | Hobby service `veilbid-relay` is linked to `huutrungle2001/Veilbid@main`, deploys through `railway.json`, runs continuously with restart policy `ALWAYS`, and exposes verified Sepolia readiness at `https://veilbid-relay-production.up.railway.app/health`; deployment `f77d0384-a946-45ff-9147-73c0f53187c2` completed repeated successful polling cycles. |
| Generic Safe upgrade | Approved | User | 2026-07-27 | Replace the fixed demo-Safe-only Buyer experience with self-service Safe discovery, per-Safe module deployment, setup/funding, automatic nonce handling, and proposal recovery. The current release is preserved in GitHub and local backup branch `backup/pre-generic-safe-20260727`. |
| Generic Safe contract release | Verified | Agent | 2026-07-27 | Factory `0x0Fd3E77A93BE3E1b05a17b2860D492f4244414d4` has exact Sourcify creation/runtime mappings and the full release verifier passed. Independent Safe `0xC85A…B752` completed threshold setup, Safe-owned funding, and atomic tender #4 while preserving owners/threshold. |
| Generic Safe frontend release | Verified | Agent | 2026-07-27 | Production deployment `dpl_HCFBAXRiSpm8nePzKutQ7kzQhSsr` is aliased to `https://veilbid-three.vercel.app`; production route/desktop/mobile smoke, keyboard navigation, release bindings, and bundled factory address checks passed. |
| iExec Hello World registration | Verified | Agent | 2026-07-27 | Wallet `0x8234…4A55` deployed the official-pattern confidential Piggy Bank and completed encrypted deposit, owner decrypt, encrypted withdrawal, and final owner decrypt on Ethereum Sepolia. |
| Safe discovery hotfix | Local verified | Agent | 2026-07-27 | Corrected the API Kit base path from the obsolete root to `/api`, restored seven indexed owner Safes, and added direct on-chain ownership verification. The local UX now presents explicit Safe cards, highlights rather than auto-opens the last-used Safe, responds immediately with selection/loading state, caches inspected status, ignores stale RPC responses, and automatically fails over from Thirdweb to independent Sepolia providers. Awaiting user confirmation before production promotion. |
| Safe treasury management | Superseded | Agent | 2026-07-27 | The broader ETH/vUSDC withdrawal surface was locally verified, then intentionally removed after product review so VeilBid remains focused on confidential vcUSDC and delegates general public-asset management to Safe Wallet. |
| Safe Buyer confidential focus | Approved | User | 2026-07-27 | Keep only vcUSDC and its private reveal control inside `SELECTED SAFE`; omit public ETH/vUSDC balances and general withdrawals because Safe Wallet already owns that surface. Remove the old Treasury Actions panel before implementing the separately verified full/custom unwrap experience. |
| Safe confidential asset exits | Verified | Agent | 2026-07-27 | Adapter `0x779b…9ff9` has exact Sourcify creation/runtime mappings and canonical-wrapper binding. Sepolia E2E funded the release Safe, executed atomic partial preparation/unwrap with replay protection, finalized the exact partial amount in memory, then full-unwrapped/finalized the remainder while preserving owners and threshold. |
| Safe confidential frontend release | Verified | Agent | 2026-07-27 | Vercel deployment `dpl_2R1QhA9CSF6VLUnGRoBcRYVQVgmS` is aliased to `https://veilbid-three.vercel.app`; three production routes, desktop/mobile browser capture, canonical Sepolia state, keyboard navigation, sticky layouts, and 198 Docs contrast checks passed without wallet or confidential data access. |
| Consolidated Safe controls release | Verified | Agent | 2026-07-27 | Vercel deployment `dpl_Eq5LN1QzBrTjDbN9GofRcGfgFhXV` merges setup/funding into `SELECTED SAFE`, replaces Full/Custom tabs with one custom amount field plus a Full shortcut, and renumbers tender creation to step 2. Production route, desktop/mobile, keyboard, sticky-layout, canonical-state, and 198 Docs contrast checks passed. |
| Connected-wallet Safe funds release | Verified | Agent | 2026-07-27 | Vercel deployment `dpl_GkVoY9FHnZBCAWMFGTmg4K5WuLUj` deposits vcUSDC to the selected Safe from the connected wallet, fixes unwrap output to that wallet, compacts `SAFE FUNDS`, and moves one-time setup into tender creation. The full repository gate, production route/desktop/mobile smoke, keyboard navigation, and 198 Docs contrast checks passed. |
| Automatic review upgrade | Verified | Agent | 2026-07-27 | Market `0x720ac8Ae5dE78590FF5184E53130460033228afc` binds a public review wallet at creation, denies it cross-bid access while Open, and automatically grants per-bid ACL after proof-derived finalization. Sepolia Safe tender #1 verified the full two-vendor lifecycle without a manual Buyer grant transaction. |
| Automatic review frontend release | Verified | Agent | 2026-07-27 | Vercel deployment `dpl_DgfAxLWdc4cfVzhtVntjEn4g4uHj` is aliased to `https://veilbid-three.vercel.app`; the primary navigation is Public/Safe Buyer/Private Bids/Activity, EOA Buyer is advanced, Vendor/review actions are consolidated, and production route, desktop/mobile, keyboard, contrast, canonical Market, and wallet-free tender checks passed. |
| First-class EOA Buyer restoration | Verified | Agent | 2026-07-27 | Vercel deployment `dpl_8b9MuiqWoBb7cWt5aRU1K1ohfXAS` restores EOA Buyer directly to the primary workspace bar alongside Safe Buyer. Its full direct-wallet funding/tender flow uses the current automatic-review Market; all repository tests/lint/build plus production routes, desktop/mobile, keyboard, contrast, and canonical tender checks passed. |
| Direct funding and Safe balance UX | Verified | Agent | 2026-07-28 | EOA and executed Safe creation now poll the Nox exact-funding proof and guide the connected wallet through permissionless `confirmTenderFunding`; Activity and Railway remain recoverable fallbacks. Safe tender creation requires the current balance handle to be revealed, rejects a ceiling above that session balance, and chains a newly executed viewer grant directly into decryption without a second click. |
| Vendor deadline and error guard | Verified | Agent | 2026-07-28 | Private Bids only lists `Open`, unexpired tenders, removes selections as they expire, rechecks before encryption, and shows local time, canonical UTC, and a live countdown. Contract/RPC errors are reduced to actionable messages without rendering calldata, handles, proofs, or request bodies. |
| Direct workflow production release | Verified | Agent | 2026-07-28 | Vercel deployment `dpl_EJfwApT4Ry9s3hBEUQECVFmFyqmH` is aliased to `https://veilbid-three.vercel.app`; production route/desktop/mobile smoke, canonical release checks, keyboard navigation, sticky layouts, and 201 Docs contrast checks passed. Railway deployment `7f1b2460-4c00-4fb9-82c9-05e8d8708f94` was uploaded from source commit `cd79636`, reached `SUCCESS`, and returned verified Sepolia readiness from `/health`. |
| Compact Safe tender balance | Verified | Agent | 2026-07-28 | Replaced the large balance-validation card inside Safe tender terms with one compact `vcUSDC` value and eye control beside `TENDER TERMS / Public procurement rules`; reveal-required and ceiling-within-balance validation remain enforced. |
| Combined buyer/private-bids navigation | Verified | Agent | 2026-07-28 | Merged Safe Buyer + EOA Buyer under one `BUYER` workspace and split Private Bids into sticky `SUBMIT BID`, `MY BID`, and `GRANTED ACCESS` views. Legacy role URLs normalize to the new views and selected subsections persist in query parameters. Web tests (85/85), lint/build, production route/desktop/mobile smoke, and keyboard/contrast smoke passed. |
| Contextual workflow guidance | Verified | Agent | 2026-07-28 | Added per-card hover/focus `?` help across Public, EOA/Vendor/Disclosure/Auditor, Safe treasury actions, and Activity recovery cards; Public now keeps the dossier list and selected detail independently visible on desktop. Confidential bid reveals format six-decimal vUSDC units instead of raw micro-units. Web tests (85/85), lint/build, production route/desktop/mobile smoke, and keyboard/contrast smoke passed. |
| Contextual guidance frontend release | Verified | Agent | 2026-07-28 | Final Vercel deployment `dpl_BAYihyHS4hBHT3p4ms7ZcmwF21we` is aliased to `https://veilbid-three.vercel.app`; production smoke and keyboard smoke passed for the contextual UI release, followed by a CSS-only alignment deployment from source commit `788b0f8`. |
| Combined workspace frontend release | Verified | Agent | 2026-07-28 | Final Vercel deployment `dpl_Db42an8dLTHNMruP1i2WXevRz7Uh` is aliased to `https://veilbid-three.vercel.app`; production smoke and real-browser keyboard smoke passed against source commit `1a39d1d`. |
| Comprehensive UI/UX release | Verified | Agent | 2026-07-28 | Vercel deployment `dpl_GL8mW3rxvqPzhtTWwwAzuKigXtMM` is aliased to `https://veilbid-three.vercel.app`; mobile sticky navigation, compact/collapsible balances, public master/detail navigation, tab-specific Private Bids guidance, approved-tender filtering, contextual help, lifecycle history, touch targets, and interaction feedback were verified. Full tests (155), lint/build, production smoke, and keyboard smoke passed. |
| Left-aligned workspace tabs | Verified | Agent | 2026-07-28 | Buyer Safe/EOA tabs and Private Bids `SUBMIT BID`, `MY BID`, and `GRANTED ACCESS` now begin on the left beside the help control on desktop and mobile. Vercel deployment `4y98RSxeMydupuEQsbBaPgrbfGHa` and the canonical alias returned HTTP 200; production and keyboard smoke passed. |
| EOA-first Buyer workspace | Verified | Agent | 2026-07-28 | Buyer navigation now places `EOA BUYER` before `SAFE BUYER` and opens EOA Buyer by default; explicit `buyer=safe` links remain backward-compatible. Vercel deployment `FgdxsHtpNnR3CuwdmcFFUquF4ujB` passed production and keyboard smoke. |
| EOA tender form UI alignment | Verified | Agent | 2026-07-28 | EOA Create Tender now uses the same structured header, numbered terms/vendor sections, vendor counter/actions, review footer, and wallet context treatment as Safe Create Tender while preserving direct-wallet funding behavior. Vercel deployment `A8pVuVQ2sr9qZ1HpgANNhT3de4Mx` passed production and keyboard smoke; web tests 86/86 passed. |
| Post-hackathon multisig backlog | Planned | Product | 2026-07-28 | Keep the hackathon release at `1 owner · threshold 1`. After submission, add owner/threshold management through standard Safe transactions, support 2-of-3 and other threshold configurations, show signer progress clearly, test create/fund/withdraw/unwrap/settlement with multiple signers, and document that owners approve treasury actions but are not automatic beneficiaries. |
| Landing and web guide audit | Verified | Agent | 2026-07-28 | Corrected the Safe deep link for the EOA-first Buyer workspace, aligned workspace naming/counts, documented Public mobile/filter behavior, all three Private Bids views, early close, Activity lifecycle history, Safe owner/beneficiary boundaries, and post-hackathon multisig scope. Vercel deployment `5PRU9antbv2z4xGE3CunyWZEMvc8` passed production and keyboard smoke with 213 Docs contrast checks. |
| Animated landing mascots | Verified | Agent | 2026-07-28 | Added three lightweight inline SVG mascots for sealed bids, Nox comparison, and Safe owner authority, with responsive composition, hover/bob/blink/orbit motion, and reduced-motion support. Desktop, mobile, and full-page visual inspection passed; Vercel deployment `8doGGXwsPS4V69QVmNH7wXnuLFTm` passed production and keyboard smoke. |
| Unified editable-control language | Verified | Agent | 2026-07-28 | All Tender Room data-entry controls now use a pale input surface, 2px rounded border, green inset affordance, distinct hover/focus feedback, visible placeholders, and separate disabled/read-only/error treatments across EOA, Safe, Private Bids, Activity-related forms, wallet utilities, and Public filters. Desktop/mobile visual review, 86 web tests, build, and Vercel deployment `GyRQ8koscaPYfZm6Q5FLgUvirmjA` production/keyboard smoke passed. |
| Activity action queue | Verified | Agent | 2026-07-28 | Replaced ambiguous Pending/Ready sections with one next-action queue: patterned `NEEDS ATTENTION` for saved interruptions, Veil Green `READY NOW` for immediately closable tenders, and black `PROCESSING` for Closed winner-proof tracking. Completed actions remain in Lifecycle History and an empty queue collapses to `ALL CAUGHT UP`. The implementation uses only canonical black/white/green and alpha-derived patterns from `DESIGNS.md`; desktop/mobile visual review, 86 tests, build, and Vercel deployment `EYA5bJvaYwPHL3dkbC4fFPCRW4Qu` production/keyboard smoke passed. |
| Automation-first Activity UX | Verified | Agent | 2026-07-28 | Renamed the queue to `AUTOMATION STATUS`, labels relay-ready work as `AUTO-READY`, and tells users that no action is required while the relay advances or tracks a winner proof. Optional `ADVANCE MANUALLY` fallbacks use secondary styling; only a genuinely interrupted saved checkpoint retains the primary `RESUME` action. Landing and Docs guidance match the automatic flow. Web tests (86/86), build, desktop/mobile visual review, and Vercel deployment `35iJ85d3kug3nUu9rEKW5H5S8ZKs` production/keyboard smoke passed against source commit `7bfdeed`. |
| Guided wallet and Sepolia connection | Verified | Agent | 2026-07-28 | Selecting a wallet now continues directly into an automatic Sepolia switch request when chain 11155111 is not active, while the header retains the compact `CONNECT WALLET` label. A rejected switch preserves the connected account in a safe wrong-chain state with signing disabled and an explicit retry. Web tests (87/87), typed lint, build, mobile visual review, and Vercel deployment `9NDRzqBGLaVkFRVi2pGCQHTXBokV` production/keyboard smoke passed against source commit `fcd2546`. |
| EOA funding, unwrap, and stable Vendor admission | Verified | Agent | 2026-07-28 | EOA Create Tender now rejects a ceiling above the current public Test USDC balance before any write and never invokes the faucet automatically. The shared EOA balance panel adds style-matched Full/Custom vcUSDC unwrap, public-proof finalization, and on-chain pending-request recovery without a second burn; calldata tests cover both deployed wrapper overloads, whose full/partial behavior already has canonical Sepolia evidence. Vendor admission is keyed to wallet and tender identity rather than the one-second countdown, eliminating the empty-state flicker. Web tests (95/95), typed lint, build, and Vercel deployment `71tw9Hd6PDmx2j6GVZAcV9jWs4GX` production/keyboard smoke passed against source commit `d8f124e`. |
| Owned/granted private-bid separation | Verified | Agent | 2026-07-28 | `MY BID` now explicitly contains only bids submitted by the connected Vendor and retains reveal/share actions. `GRANTED ACCESS` automatically reads every indexed bid ACL through resilient Sepolia RPCs, displays only references authorized for the connected wallet, and allows direct session reveal without a separate manual permission-check step or unauthorized public-bid fallback. Full repository tests (97 web tests), lint/build, and Vercel deployment `GpahbbsAJnXFRfHcm992qhJJEBmQ` production/keyboard smoke passed against source commit `114cc3c`. |
| Public Open filter and sticky dossier controls | Verified | Agent | 2026-07-28 | Public now provides an explicit `Open` filter. `CONFIRMED DOSSIERS`, the visible count, refresh action, and status selector remain together at the head of the independently scrolling desktop list and below the mobile workspace rail. Contextual `?` triggers stay below sticky navigation layers. Browser geometry checks, desktop/mobile visual review, full repository tests (98 web tests), lint/build, and Vercel deployment `B3FYXEcvoKr2Rbwx9Hru9y7ZfeiX` production/keyboard smoke passed against source commit `a0f436e`. |
| Derived close-readiness UX | Verified | Agent | 2026-07-28 | Public distinguishes contract status from operational readiness: an on-chain `Open` tender whose deadline passed or whose Vendor slots are full immediately receives a striped `READY TO CLOSE` badge and appears under its own filter. The `Open` filter now contains only bid-accepting tenders; lifecycle continues to show `OPEN` until a permissionless close transaction confirms. Full repository tests (99 web tests), lint/build, desktop visual review, and Vercel deployment `APyiPkAuvu8fVuGyWsfLnQAWfVqW` production/keyboard smoke passed against source commit `d4a106a`. |
| Persistent winner notifications | Verified | Agent | 2026-07-28 | A connected winning wallet now receives an unread on-chain award banner, while Activity retains its complete award history with the exact `TenderAwarded` block, settlement transaction, and receipt link. Award facts are always reconstructed from the confirmed Sepolia index; local storage is isolated by chain, Market, and wallet and contains read tender IDs only. Full repository tests (103 web tests; 173 total), lint/build, production desktop/mobile smoke, and keyboard/contrast smoke passed on Vercel deployment `HVvT8AxquG831VLM5NR7aFAaRd3d` from source commit `fe4dd9b`. |
| Final submission | Pending |  |  |  |

## 5. Current risks

| ID | Risk | Impact | Owner | Status |
|---|---|---|---|---|
| RSK-001 | Cross-transaction ACL for stored/computed bid handles behaves differently than expected | High | Engineering | Closed by Gate A Sepolia evidence |
| RSK-002 | Public-decryption proof latency makes finalization unreliable | High | Engineering | Mitigated by retry/checkpoint/reload recovery; monitor |
| RSK-003 | Safe owner input proofs require a restricted module pattern | High | Engineering | Closed by Gate E Sepolia evidence |
| RSK-004 | Cross-contract ERC-7984 settlement adds ACL complexity | High | Engineering | Closed for MVP by selecting internal custody |
| RSK-005 | Scope cannot reach release quality before the submission deadline | High | Product | Open |
| RSK-006 | ERC-7984 underfunding returns encrypted zero, so transaction success cannot establish publicly funded state | High | Engineering | Mitigated and verified by exact-funding public proof |

## 6. Completion checklist

- [x] Independent workspace contents defined.
- [x] Architecture target covers all required production-grade trust boundaries,
  lifecycle services, recovery paths, and verification layers.
- [x] Original source directory and source-priority policy exist.
- [x] Product Plan approved.
- [x] All mandatory feasibility spikes pass with reproducible evidence.
- [x] Core product works without mock data.
- [x] Contracts and web client are deployed.
- [x] Ethereum Sepolia source/deployment mapping is verified.
- [x] `feedback.md` contains evidence-based feedback.
- [x] GitHub repository is public.
- [ ] Demo video is no longer than four minutes.
- [ ] X post and DoraHacks submission are public.
