# VeilBid Master Plan

> This file coordinates progress. Requirements and rubric details remain
> canonical in `docs/`.

## 1. Current status

- Current phase: Phase 0 — Workspace and product-definition handoff
- Status: Waiting for approval
- Next action: User reviews the VeilBid Product Plan, architecture, and mandatory
  feasibility gates.
- Current blocker: No technical blocker has been measured; feasibility is not yet
  proven.
- Awaiting approval from: User
- Last updated: 2026-07-25T20:52:24+07:00

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
| 0. Workspace handoff | Establish canonical documents, sources, and repository rules | User reviews handoff | Waiting for approval |
| 1. Context and problem validation | Confirm competition facts, user pain, technical inputs, and product value | Decision-ready context | Todo |
| 2. Product definition | Approve MVP, non-goals, acceptance criteria, and demo story | User approves Product Plan | Todo |
| 3. Feasibility spikes | Prove handle persistence, encrypted argmin, public winner proof, and confidential settlement | All four mandatory gates pass | Todo |
| 4. Build design | Freeze stack, contract interfaces, privacy model, milestones, and evidence schema | User approves Build Plan | Todo |
| 5. Core development | Implement contracts, tests, generated artifacts, and local client | Core Product Ready gate | Todo |
| 6. Sepolia and product | Deploy contracts, complete web/finalizer/MCP, verify live flows | Release verification passes | Todo |
| 7. Submission | Publish repository, feedback, live UI, video, X post, and DoraHacks entry | User final review | Todo |

Only one phase may be `In progress`.

## 4. Approval log

| Gate | Decision | Confirmed by | Date | Notes |
|---|---|---|---|---|
| Multiple submissions | Approved | User | 2026-07-25 | Organizer permission was confirmed by the user. |
| Product direction | Approved in principle | User | 2026-07-25 | VeilBid confidential procurement selected for detailed planning. |
| Workspace creation | Approved | User | 2026-07-25 | Independent workspace and Git repository requested. |
| Product Plan | Pending |  |  |  |
| Feasibility gate | Pending |  |  |  |
| Build Plan | Pending |  |  |  |
| Final submission | Pending |  |  |  |

## 5. Current risks

| ID | Risk | Impact | Owner | Status |
|---|---|---|---|---|
| RSK-001 | Cross-transaction ACL for stored/computed bid handles behaves differently than expected | High | Engineering | Open |
| RSK-002 | Public-decryption proof latency makes finalization unreliable | High | Engineering | Open |
| RSK-003 | Safe owner input proofs require a restricted module pattern | High | Engineering | Open |
| RSK-004 | Cross-contract ERC-7984 settlement adds ACL complexity | High | Engineering | Open |
| RSK-005 | Scope cannot reach release quality before the submission deadline | High | Product | Open |

## 6. Completion checklist

- [x] Independent workspace contents defined.
- [x] Architecture target covers all required production-grade trust boundaries,
  lifecycle services, recovery paths, and verification layers.
- [x] Original source directory and source-priority policy exist.
- [ ] Product Plan approved.
- [ ] All mandatory feasibility spikes pass with reproducible evidence.
- [ ] Core product works without mock data.
- [ ] Contracts and web client are deployed.
- [ ] Ethereum Sepolia source/deployment mapping is verified.
- [ ] `feedback.md` contains evidence-based feedback.
- [ ] Demo video is no longer than four minutes.
- [ ] Public GitHub, X post, and DoraHacks submission are complete.
