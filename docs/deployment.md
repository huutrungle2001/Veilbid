# VeilBid Deployment Guide

This document separates three operations:

1. Running the verified Ethereum Sepolia release locally.
2. Deploying the web application and stateless relay against that release.
3. Creating and verifying a new contract release.

The canonical release manifest is
`packages/contracts/deployments/sepolia.release.json`. Runtime consumers use the
generated copy under `packages/chain-bindings/generated/addresses/`. Never
change public addresses manually.

## Prerequisites

- Node.js `>=24 <25` (`24.18.0` in CI).
- pnpm `10.33.0` through Corepack.
- Git.
- A Sepolia RPC endpoint.
- Disposable, gas-funded Sepolia wallets only for write-enabled operations.
- A Vercel or equivalent static-hosting account for the web application.
- A Railway or equivalent long-running Node host for the relay.

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm lint
corepack pnpm build
```

## Environment

Copy the template only for commands that need an RPC or signer:

```bash
cp .env.example .env.local
```

`SEPOLIA_RPC_URL` is sufficient for read-only health and verification.
`FINALIZER_PRIVATE_KEY` is required only by a write-enabled relay.
`SEPOLIA_PRIVATE_KEY` and `SEPOLIA_VENDOR_PRIVATE_KEY` are maintainer-only
inputs for deployment preflight and live lifecycle verification.

Rules:

- `.env.local` must remain ignored and untracked.
- Never use mainnet keys or wallets holding valuable assets.
- Never place private keys in Vercel browser environment variables.
- Keep `VEILBID_ALLOW_UNVERIFIED_DEPLOYMENT=false` for the public release.

## Run the verified release locally

The default browser build already consumes the verified Sepolia address
snapshot:

```bash
corepack pnpm --filter @veilbid/tender-room dev --host 0.0.0.0
```

Open `http://localhost:5173`. An optional `VITE_SEPOLIA_RPC_URL` can override
the public read-only RPC. Browser write flows always use the explicitly selected
injected wallet.

Before publishing a local build:

```bash
corepack pnpm bindings:check
corepack pnpm verify:deployment:release
corepack pnpm secret:scan
corepack pnpm evidence:validate
```

## Deploy the web application

`vercel.json` is the canonical static-hosting configuration:

- install: `pnpm install --frozen-lockfile`
- build: chain bindings followed by the Tender Room
- output: `apps/web/dist`
- SPA fallback: every route rewrites to `index.html`

Import the repository root into Vercel and deploy `main`. No signer or private
key is required. Set `VITE_SEPOLIA_RPC_URL` only when overriding the default
public read provider.

Equivalent Vercel CLI flow:

```bash
vercel link
vercel deploy
vercel deploy --prod
```

After production promotion:

```bash
corepack pnpm test:production https://your-production-domain.example
corepack pnpm test:keyboard https://your-production-domain.example
```

Confirm that `/`, `/room`, and `/docs` return HTTP 200 and that the wallet-free
public path shows the Market address from the generated release snapshot.

## Deploy the settlement relay

`railway.json` builds only shared bindings and `apps/relay`, starts polling, and
uses `/live` for process health.

Configure these service variables:

```dotenv
SEPOLIA_RPC_URL=https://your-sepolia-rpc.example
FINALIZER_PRIVATE_KEY=0xdedicated_testnet_key
FINALIZER_ACTION_BUDGET=3
FINALIZER_POLL_INTERVAL_MS=30000
FINALIZER_PROOF_ATTEMPTS=3
FINALIZER_PROOF_DELAY_MS=5000
FINALIZER_HEALTH_HOST=0.0.0.0
VEILBID_ALLOW_UNVERIFIED_DEPLOYMENT=false
```

Railway supplies `PORT`. The finalizer wallet needs Sepolia ETH for public
funding-confirmation, close, and finalize writes; it receives no bid-decryption
or buyer authority.

Validate locally before deployment:

```bash
corepack pnpm finalizer:health
corepack pnpm finalizer:dry
```

Validate the hosted service:

```bash
curl --fail https://your-relay.example/live
curl --fail https://your-relay.example/health
```

`/health` must report chain `11155111`, canonical Market bytecode present, and a
verified release manifest. Keep only one continuously scheduled relay unless
multiple runners have an explicit operational purpose.

## Create a new contract release

This workflow spends Sepolia ETH and creates persistent public state. It is not
required to run or inspect the existing release.

### 1. Prepare a release branch

- Start from a clean, pushed commit.
- Run the full release checks.
- Preserve the current verified manifest and evidence as historical records.
- Never overwrite or relabel a historical address as a new deployment.
- For a new full deployment, archive the previous manifest in a dedicated
  commit and let the deployment script create a new
  `sepolia.release.json`.

The deployment script requires `HEAD` to equal its upstream and permits no
uncommitted file except the in-progress release manifest.

### 2. Preflight without writes

```bash
corepack pnpm compile
corepack pnpm --filter @veilbid/auction-house preflight:release -- --no-write
corepack pnpm secret:scan
```

Preflight checks chain ID, distinct deployer/vendor actors, gas balances,
compiled creation bytecode, clean Git state, and ignored local configuration.

### 3. Deploy and configure

```bash
corepack pnpm deploy:release
```

The script deploys the test asset, official-wrapper extension, Market and
embedded receipt, Safe, restricted preparation module, and related release
components; it then records transactions, blocks, wiring, and Safe
configuration in the manifest. The new manifest remains `verified: false`.

Do not allow web or relay writes against an unverified manifest.

### 4. Publish source and verify deployment

```bash
corepack pnpm publish:sources:release
corepack pnpm verify:deployment:release -- --promote
```

Promotion requires exact source publication plus checks for receipts, creation
and runtime bytecode, constructor arguments, immutable wiring, Safe owners and
threshold, enabled module, and Market operator state.

### 5. Synchronize runtime consumers

```bash
corepack pnpm bindings:generate
corepack pnpm bindings:check
corepack pnpm build
```

Commit the new manifest, generated bindings, and sanitized evidence together.
Never hand-edit generated ABI/address snapshots.

### 6. Acceptance evidence

Run the release lifecycle only with disposable funded wallets:

```bash
corepack pnpm test:sepolia:release:two-vendor
corepack pnpm verify:deployment:release
corepack pnpm evidence:validate
```

Confidential plaintext values must be asserted in memory and omitted from saved
artifacts. A deployment is not canonical until runtime bytecode, exact source
mapping, bindings, live lifecycle, and public-safe evidence all agree.

## Rollback and recovery

- Web: promote the last verified Vercel deployment that uses the same canonical
  bindings.
- Relay: stop the unhealthy service; permissionless state remains recoverable
  by another caller or the Activity UI.
- Contracts: deployed code is non-upgradeable. Never reuse an old address for a
  new claim. Publish a new verified manifest and preserve the former one as
  historical.
- Proof outage: do not substitute mock data or timeout-refund a closed tender;
  resume public proof finalization when Nox services recover.
