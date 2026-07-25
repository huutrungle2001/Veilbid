# VeilBid feasibility workspace

This isolated workspace executes Feasibility Gates A–E. It is not a production
runtime package or deployment authority.

Requirements:

- Node.js 24, pinned by the root `.nvmrc`.
- pnpm 10.33.0 through Corepack.
- `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` in ignored `.env.local` for live
  feasibility runs.
- Docker Engine with Compose support only for optional local Nox regression
  runs.

The workspace never substitutes a mock result when the Nox runtime, RPC, or
credentials are unavailable. Evidence records only public identifiers,
assertion booleans, tool versions, and blocker codes.
