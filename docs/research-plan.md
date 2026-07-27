# VeilBid Research Plan

> Status: Nox/Safe technical validation is complete. The official August 1
> deadline date is confirmed; the exact DoraHacks cutoff time remains open.

## 1. Objectives

- Verify competition and submission requirements from the highest-priority
  available sources.
- Confirm that confidential procurement is a material privacy use case.
- Understand procurement users, privacy needs, and deployable product patterns.
- Validate Nox comparison, selection, ACL, public decryption, ERC-7984, and Safe
  capabilities against installed packages and live Sepolia.
- Produce evidence for Product Plan, threat model, and demo claims.

## 2. Research questions

1. Which procurement fields must remain private, and which must be public for
   coordination?
2. Can Nox maintain an encrypted minimum and encrypted associated bid ID across
   transactions?
3. Can winner ID be publicly decrypted without disclosing best price?
4. Can official ERC-7984 wrappers settle the encrypted price and remainder?
5. Can a restricted Safe module preserve threshold authority?
6. Which procurement UX, audit, and recovery patterns make the product usable
   without weakening confidentiality?
7. Can the differentiator and full lifecycle fit a four-minute demo?

## 3. Source order

1. Official DoraHacks/rules.
2. Official challenge page and organizer announcements.
3. Official iExec Nox documentation and published package source.
4. Direct organizer responses.
5. Public project repositories and deployment evidence.
6. User-provided transcripts.
7. Agent inference.

Every finding must include a source or be labelled as inference.

## 4. Initial evidence log

| ID | Finding | Type | Source | Confidence |
|---|---|---|---|---|
| RES-001 | Challenge prioritizes privacy integrated into real open-source infrastructure | Captured requirement | `original/user-provided-challenge-brief.md` | Medium |
| RES-002 | Creativity and end-to-end each carry 3/14 stars | Captured requirement | `judging-criteria.md` | Medium |
| RES-003 | Nox 0.2.4 package source exposes comparisons, `select`, ACL, and public-decryption proof verification | Package-source fact | `@iexec-nox/nox-protocol-contracts@0.2.4` | High; installed and verified on Sepolia |
| RES-004 | Safe ownership, restricted-module authorization, and proof recovery work in the selected architecture | VeilBid empirical result | `verification.md` | High for the recorded Sepolia release |
| RES-007 | Official iExec announcement states that submissions close August 1, 2026 | Organizer announcement | iExec LinkedIn announcement in `important-notes.md` | High for date; exact cutoff time not stated |
| RES-005 | Transcript reports an existing ShadowSafe Payroll submission | User-provided transcript | `original/discord-context-extract.md` | Medium |
| RES-006 | User confirmed multiple independent submissions are permitted | User confirmation | `important-notes.md` | Medium until organizer evidence stored |

## 5. Required remaining research

- Capture the exact DoraHacks cutoff time; its public page currently presents a
  WAF challenge to this environment.
- Record gas/runtime behavior for up to eight encrypted bids.
- Validate the Safe Buyer, Private Bids, public-finalizer, and review journeys with target
  users or realistic walkthroughs.

## 6. Feasibility handoff

Documentation research cannot prove Nox handle lifecycle. The mandatory empirical
work is defined in `feasibility-plan.md`. Any unexpected ACL or proof behavior
must update:

- `architecture.md`
- `contract-spec.md`
- `threat-model.md`
- `verification.md`
- `feedback.md`

## 7. Completion condition

Research is complete when:

- Official submission facts are captured.
- All mandatory Nox/Safe assumptions have either live evidence or are removed
  from product claims.
- Product decisions are justified by user value, technical evidence, and the
  rubric rather than by feature comparison with other submissions.
