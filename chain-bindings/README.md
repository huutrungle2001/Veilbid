# Chain Bindings

Generated ABI/address snapshots and shared event, index, readiness, and domain
types. Generated content comes only from canonical Auction House artifacts and
deployments.

Run `pnpm bindings:generate` at the repository root after compiling Auction
House. `pnpm bindings:check` fails when committed JSON differs from the
canonical artifacts or deployment manifest.

Runtime consumers use the verified `sepolia.release` snapshot. The separate
`sepolia.test` snapshot remains deliberately marked `verified: false` for
reusable historical E2E checks and must not be relabeled as a release.
