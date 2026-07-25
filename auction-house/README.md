# Auction House

Canonical Solidity, tests, deployments, verification, and artifact generation
for VeilBid. Feasibility contracts are not imported into this workspace;
production behavior is implemented and tested here from the approved
specification.

Workspace ownership:

- `contracts/market/`: confidential tender lifecycle and internal custody.
- `contracts/safe/`: preparation-only Safe integration.
- `contracts/receipt/`: non-transferable award receipt.
- `contracts/test-assets/`: faucet token and official ERC-7984 wrapper extension.
- `test/`: unit, invariant, Nox runtime, and Sepolia suites.
- `scripts/`, `verify/`, `deployments/`: canonical deployment workflow.

`pnpm test` runs deterministic tests that do not invoke Nox primitives through
the plain EVM configuration. `pnpm test:nox` is the separate real local Nox
suite and requires its Docker-backed services; Sepolia remains the mandatory
confidential-runtime evidence environment.
