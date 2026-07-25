# VeilBid Repository Layout

> Status: Implemented canonical source layout.

## 1. Top-level structure

```text
Veilbid/
├── feasibility/
│   ├── contracts/
│   ├── test/
│   ├── scripts/
│   └── README.md
├── tender-room/
│   ├── scripts/
│   ├── src/
│   │   ├── transactions/
│   │   ├── public-market/
│   │   ├── auditor/
│   │   ├── safe/
│   │   ├── activity/
│   │   ├── wallet/
│   │   ├── workspaces/
│   │   └── shell/
│   └── test/
├── auction-house/
│   ├── contracts/
│   │   ├── market/
│   │   ├── safe/
│   │   ├── receipt/
│   │   └── test-assets/
│   ├── test/
│   │   ├── unit/
│   │   ├── property/
│   │   ├── static/
│   │   └── sepolia/
│   ├── scripts/
│   ├── verify/
│   └── deployments/
├── settlement-relay/
│   ├── src/
│   └── test/
├── operator-console/
│   ├── src/
│   │   └── mcp/
│   └── test/
├── chain-bindings/
│   ├── generated/
│   ├── src/
│       ├── events/
│       ├── index/
│       ├── readiness/
│       └── domain/
│   └── test/
├── evidence/
│   ├── schemas/
│   ├── local/
│   └── sepolia/
├── docs/
│   └── original/
├── AGENTS.md
├── DESIGNS.md
├── PLAN.md
├── README.md
└── feedback.md
```

## 2. Workspace responsibilities

### `feasibility`

The retained pre-build source workspace. It owns the minimal contracts, tests,
and scripts that produced Feasibility Gates A–E.

It is not a product runtime package, deployment authority, or source of
canonical consumer artifacts. Reusable findings must be reimplemented or
deliberately migrated into `auction-house` after the gates pass and the
architecture is selected.

### `tender-room`

The only browser product. It owns presentation, route state, injected-wallet
selection, Handle SDK authorization, session-only plaintext, responsive
interaction, and the public tender explorer.

It does not own canonical lifecycle state and cannot calculate or submit a
winner.

### `auction-house`

The only Solidity and deployment authority. It owns protocol contracts,
Hardhat configuration, fixtures, invariants, deployment scripts, source
verification, and canonical deployment JSON.

It never imports frontend or automation code.

### `settlement-relay`

Permissionless lifecycle automation. It discovers public readiness, requests
public winner proofs, simulates writes, and sequentially calls close, finalize,
or refund.

It contains no private reveal path and no database.

### `operator-console`

Local CLI and MCP integration. Exactly five public read tools are implemented.
There is no signer, write, or decryption path.

### `chain-bindings`

Generated boundary between on-chain deployment and consumers. It contains:

- Exact ABI snapshots.
- Chain/address manifests.
- Event decoders and lifecycle normalization.
- Rebuildable public index logic.
- Readiness and domain types shared by the browser, relay, and console.

Generated files are updated only from `auction-house`.

### `evidence`

Committed evidence is sanitized and schema-validated. Confidential plaintext,
handles, proofs, signatures, and keys are forbidden. Local private artifacts go
under ignored `.local/`, not here.

## 3. Dependency direction

```mermaid
flowchart LR
    AH["auction-house"] -->|generate| CB["chain-bindings"]
    CB --> TR["tender-room"]
    CB --> SR["settlement-relay"]
    CB --> OC["operator-console"]

    AH -.->|emit sanitized results| EV["evidence"]
    TR -.->|emit sanitized results| EV
    SR -.->|emit sanitized results| EV
    OC -.->|emit sanitized results| EV
```

Rules:

- `auction-house` depends on no other workspace.
- `chain-bindings` consumes generated contract artifacts but never imports
  runtime code from `auction-house`.
- `tender-room`, `settlement-relay`, and `operator-console` may depend on
  `chain-bindings`; they do not depend on each other.
- `evidence` is output, never a runtime source of truth.
- Cross-workspace imports use published package entry points, not relative paths
  into another workspace's `src/`.
- Circular dependencies are prohibited.

## 4. Canonical ownership

| Artifact | Canonical location |
|---|---|
| Pre-build spike source and tests | `feasibility/` |
| Solidity source and tests | `auction-house/` |
| Deployment addresses and transactions | `auction-house/deployments/` |
| Consumer ABIs and addresses | `chain-bindings/generated/` |
| Public lifecycle indexing | `chain-bindings/src/index/` |
| Browser session plaintext | `tender-room` memory only |
| Finalizer checkpoint | Local ignored relay runtime file |
| MCP implementation | `operator-console/`; read-only with no signer |
| Public verification artifacts | `evidence/` |
| Product/security/submission truth | `docs/` and root judge files |

## 5. Root orchestration

The root workspace list contains the retained feasibility package and all
production packages:

```json
{
  "workspaces": [
    "feasibility",
    "tender-room",
    "auction-house",
    "settlement-relay",
    "operator-console",
    "chain-bindings"
  ]
}
```

Root scripts orchestrate builds; they do not contain application logic.

## 6. Scaffolding gate record

Production workspaces were created only after Gates A–D passed, Gate D selected
internal market custody, and the Build Plan was approved. The Safe-owned release
path was not marked complete until Gate E passed on Sepolia.
