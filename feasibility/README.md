# VeilBid feasibility workspace

This isolated workspace executes Feasibility Gates A–E. It is not a production
runtime package or deployment authority.

Requirements:

- Node.js 24, pinned by the root `.nvmrc`.
- pnpm 10.33.0 through Corepack.
- Docker Engine with Compose support for the official Nox Hardhat plugin.
- `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` only for explicit live runs.

The workspace never substitutes a mock result when the Nox runtime, RPC, or
credentials are unavailable. Evidence records only public identifiers,
assertion booleans, tool versions, and blocker codes.
