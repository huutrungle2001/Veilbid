# VeilBid User Guide

This guide covers the public release at
[`https://veilbid-three.vercel.app`](https://veilbid-three.vercel.app) on
Ethereum Sepolia (`11155111`). VeilBid is unaudited, testnet-only software; use
only disposable wallets and faucet-backed assets.

## Public verification

No wallet is required.

1. Open `/room`.
2. Select finalized tender `#1`.
3. Inspect the public buyer, approved vendors, ceiling, deadline, lifecycle,
   proof-derived winner, settlement transaction, and non-transferable receipt.
4. Confirm that neither winning nor losing bid prices appear in the dossier.
5. Follow the address and transaction links to Sepolia.

The public index is rebuilt from contract events. Records inside the 12-block
finality window are labeled accordingly. RPC or indexing failure produces an
explicit unavailable state; the application never substitutes mock success.

## Wallet setup

- Install an injected EIP-6963 wallet such as MetaMask.
- Select Ethereum Sepolia. VeilBid requests a network switch when necessary.
- Fund every signing wallet with Sepolia ETH for gas.
- Use the in-app faucet only for the public test USDC asset.
- Never paste a private key into the web application.

Changing account or network clears session-only confidential reveals and
disables stale signing state.

## EOA Buyer

1. Open `BUYER`, then `EOA BUYER`.
2. Connect the buyer wallet and obtain enough public Test USDC.
3. Enter public metadata, a ceiling, a future deadline, and one to eight unique
   approved vendor addresses.
4. Submit `CREATE WITH EOA` and approve the guided wrap, authorization, encrypted
   funding, and tender-creation transactions.
5. Wait for the public exact-funding proof. The tender accepts bids only after
   it moves from `FundingPending` to `Open`.
6. Monitor public bid count without receiving access to vendor prices.
7. Let the relay close/finalize the tender, or use the permissionless recovery
   controls in `ACTIVITY`.
8. After proof-derived finalization, the creation-bound review wallet receives
   per-bid viewer access automatically.

The balance panel also supports full or custom vcUSDC unwrap. Full unwrap can
use the current encrypted balance handle directly. Custom unwrap first requires
a session-only balance reveal. Public-proof finalization makes the unwrapped
amount and recipient public.

## Safe Buyer

1. Open `BUYER`, then `SAFE BUYER`, and connect a current owner of a Sepolia
   Safe.
2. Select a discovered Safe or inspect a manually entered address.
3. Deposit public Test USDC from the connected wallet into the selected Safe as
   confidential vcUSDC.
4. If required, approve the one-time Safe setup. The threshold-authorized batch
   deploys/enables the deterministic preparation module, binds the canonical
   Market, and configures settlement authority.
5. Reveal the current Safe vcUSDC balance only when validating a custom amount
   or ceiling. Viewer access is scoped to the current handle.
6. Enter the tender terms and submit the atomic preparation/create proposal.
7. Satisfy the Safe's normal owner threshold. Preparation alone cannot move
   Safe-owned funds.
8. Resume any pending proposal from the public Safe transaction hash shown in
   the interface.

The preparation module has no `execTransactionFromModule` or arbitrary-call
surface. Public ETH, Test USDC, and unrelated Safe assets remain managed through
Safe Wallet.

## Private Bids

### Submit Bid

1. Connect an address in the tender's public approved-vendor set.
2. Select an `Open`, unexpired tender.
3. Enter the price in the browser session.
4. Encrypt it for the exact chain, Market, tender, and vendor.
5. Simulate and sign the immutable bid submission.
6. Verify that the public bid count changes while the price remains absent.

Each approved vendor has one bid slot. Zero and over-ceiling values are handled
inside encrypted computation and cannot win.

### My Bid

The connected vendor can reveal its own bid in the current browser session and
can grant a nonzero address viewer access to that one stored handle. A grant
does not confer token-operator, signing, settlement, or Safe authority.

### Granted Access

The application checks indexed per-bid ACL state and lists only bid references
the connected wallet is authorized to reveal. The tender's fixed review wallet
receives stored-bid access automatically only after terminal finalization.

## Activity and settlement

The stateless relay normally advances public work:

1. Confirm exact funding.
2. Close after the deadline or when every approved vendor has bid.
3. Request public decryption of the encrypted winner ID only.
4. Submit the proof to finalize award or zero-winner refund.

`ACTIVITY` exposes manual permissionless recovery when automation is delayed.
If proof generation is not ready, the closed tender remains recoverable and the
checkpoint can be resumed. There is no timeout refund after close.

## Privacy boundary

Confidential by default:

- Bid prices and encrypted validity/comparison state.
- Best-price accumulator.
- Escrow, winner payment, buyer remainder, and vcUSDC balances.

Public by design:

- Tender terms, ceiling, buyer, review wallet, approved vendors, bidder
  addresses, timing, and lifecycle.
- Encrypted handles, although not their underlying values.
- Proof-derived winner, transactions, and receipt.
- Unwrap amount and recipient after public-proof finalization.

VeilBid does not claim anonymous bidders, hidden metadata, service-quality
verification, collusion resistance, formal auditing, or mainnet readiness.

## Troubleshooting

- **Wrong network:** retry the Sepolia switch; writes remain disabled until the
  wallet reports chain `11155111`.
- **RPC unavailable:** retry or use the canonical production application. No
  mock data is inserted.
- **Nox indexing/proof delay:** keep the checkpoint and resume from `ACTIVITY`.
- **Stale Safe balance reveal:** refresh and authorize the new balance handle.
- **Pending Safe proposal:** open the proposal link and collect the remaining
  threshold approvals.
- **Rejected wallet request:** the protocol state is unchanged; restart the
  interrupted action from the relevant workspace.
