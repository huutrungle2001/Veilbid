# Tender Room

VeilBid's browser product. The current slice is a wallet-free public explorer
that rebuilds tender dossiers from finalized Ethereum Sepolia logs.

It intentionally:

- reads the generated, verified `sepolia.release` address snapshot;
- starts at the recorded market deployment block and paginates bounded log
  ranges;
- waits 12 blocks before indexing events;
- shows explicit loading, empty, and RPC-failure states;
- never inserts mock tenders after a read failure; and
- never indexes bid values, confidential balances, handles, or proofs.

Run it from the repository root with:

```bash
pnpm --filter @veilbid/tender-room dev
pnpm --filter @veilbid/tender-room test
pnpm --filter @veilbid/tender-room build
```

`VITE_SEPOLIA_RPC_URL` may override the public read-only RPC. Buyer, Vendor,
Auditor, Activity, and Safe Treasury interfaces remain later release slices.
Tender Room does not determine winners or own canonical lifecycle state.
