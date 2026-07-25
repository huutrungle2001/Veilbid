# Settlement Relay

Stateless, permissionless close and public-proof/finalize automation, including
the proof-derived zero-winner refund outcome. It uses public chain state only
and does not hold private decryption or buyer authority.

The core planner prioritizes proof-ready `finalize` actions, then expired
`close` actions. The runner processes actions sequentially under one shared
budget, rereads state before each action, and classifies a failed competing
write as a benign race only after another canonical state read confirms that
the action was resolved.

Structured results contain only the action kind, public tender ID, outcome,
public transaction hash, and an allowlisted reason code. Handles, proofs,
private keys, plaintext bids, balances, and raw provider errors are excluded.

## Commands

Build first, then load the root `.env.local`:

```bash
pnpm --filter @veilbid/settlement-relay build
node --env-file-if-exists=.env.local settlement-relay/dist/cli.js dry-run
node --env-file-if-exists=.env.local settlement-relay/dist/cli.js health
node --env-file-if-exists=.env.local settlement-relay/dist/cli.js once
node --env-file-if-exists=.env.local settlement-relay/dist/cli.js poll
```

`dry-run` and `health` require only `SEPOLIA_RPC_URL`. `once` and `poll`
require a dedicated gas-funded `FINALIZER_PRIVATE_KEY`. Runtime consumers use
the verified canonical release manifest. The
`VEILBID_ALLOW_UNVERIFIED_DEPLOYMENT` escape exists only for historical test
manifests and must remain false for release operation.

Polling exposes `GET /health` on `127.0.0.1:8787` by default. Each cycle rebuilds
the finalized public index in bounded RPC ranges; it keeps no database or
confidential checkpoint. A zero winner ID follows the same `finalizeTender`
call and produces the contract's full-refund outcome.
