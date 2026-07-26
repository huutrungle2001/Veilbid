# VeilBid Master Plan

> This file coordinates progress. Requirements and rubric details remain
> canonical in `docs/`.

## 1. Current status

- Current phase: Phase 7 — Submission
- Status: Waiting for approval
- Next action: Attach the user's final demo-video URL, verify it signed out, then
  publish the prepared X and DoraHacks entries.
- Current blocker: The public repository and product release are ready. The
  real-person demo video, X post, and DoraHacks publication remain
  user-controlled.
- Awaiting approval from: Hữu Trung — final video URL and publication.
- Last updated: 2026-07-26T10:57:06+07:00

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
| 6. Sepolia and product | Deploy contracts, complete web/finalizer/MCP, verify live flows | Release verification passes | Completed |
| 7. Submission | Publish repository, feedback, live UI, video, X post, and DoraHacks entry | User final review | Waiting for approval |

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
