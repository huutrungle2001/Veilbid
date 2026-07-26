# Tender Room

VeilBid's browser product. The current slice is a wallet-free public explorer
plus Buyer, Vendor, Activity, Auditor, and Safe Treasury workspaces. The public
route rebuilds tender dossiers through the latest confirmed Ethereum Sepolia
block and labels records that remain inside the 12-block finality window.

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
pnpm test:production https://veilbid-three.vercel.app
```

`VITE_SEPOLIA_RPC_URL` may override the public read-only RPC. Buyer, Vendor,
Auditor, Activity, and Safe Treasury writes always require an explicitly
connected wallet. Tender Room does not determine winners or own canonical
lifecycle state.
