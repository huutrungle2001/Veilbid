# Chain Bindings

Generated ABI/address snapshots and shared event, index, readiness, and domain
types. Generated content comes only from canonical Auction House artifacts and
deployments.

Run `pnpm bindings:generate` at the repository root after compiling Auction
House. `pnpm bindings:check` fails when committed JSON differs from the
canonical artifacts or deployment manifest.

The current `sepolia.test` address snapshot is deliberately marked
`verified: false`: it is reusable E2E infrastructure, not the release
deployment. Consumers must not relabel it as verified.
