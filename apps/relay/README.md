# Settlement Relay

Stateless, permissionless funding confirmation, close, and public-proof/finalize
automation, including the proof-derived zero-winner refund outcome. It uses public chain state only
and does not hold private decryption or buyer authority.

The core planner confirms exact funding first, then prioritizes proof-ready
`finalize` actions and `close` actions, including early close when all approved
vendors have bid. The runner processes actions sequentially under one shared
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
node --env-file-if-exists=.env.local apps/relay/dist/cli.js dry-run
node --env-file-if-exists=.env.local apps/relay/dist/cli.js health
node --env-file-if-exists=.env.local apps/relay/dist/cli.js once
node --env-file-if-exists=.env.local apps/relay/dist/cli.js poll
```

The public repository also includes `.github/workflows/settlement-relay.yml`.
It runs one bounded `finalizer:once` cycle every five minutes and can be
started with `workflow_dispatch`. Configure the repository Actions secrets
`SEPOLIA_RPC_URL` and `FINALIZER_PRIVATE_KEY`; the workflow never stores them
in the repository or prints them in logs. Its concurrency group prevents
overlapping cycles.

`dry-run` and `health` require only `SEPOLIA_RPC_URL`. `once` and `poll`
require a dedicated gas-funded `FINALIZER_PRIVATE_KEY`. Runtime consumers use
the verified canonical release manifest. The
`VEILBID_ALLOW_UNVERIFIED_DEPLOYMENT` escape exists only for historical test
manifests and must remain false for release operation.

Polling exposes chain readiness at `GET /health` and process liveness at
`GET /live` on `127.0.0.1:8787` by default. Hosted deployments set
`FINALIZER_HEALTH_HOST=0.0.0.0` and supply `PORT`. The canonical Railway
service is linked to the repository's `main` branch, reads `railway.json`, and
publishes health at
`https://veilbid-relay-production.up.railway.app/health`. Each cycle rebuilds
the finalized public index in bounded RPC ranges; it keeps no database or
confidential checkpoint. A zero winner ID follows the same `finalizeTender`
call and produces the contract's full-refund outcome.
