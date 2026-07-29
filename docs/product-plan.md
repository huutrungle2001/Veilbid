# VeilBid Product Scope and Acceptance Criteria

> Status: Implemented. Feasibility Gates A–E and the canonical Sepolia release
> are complete.

## 1. Product identity

- Name: VeilBid
- Tagline: Confidential Procurement for Safe Treasuries
- Client: Responsive web application
- Network: Ethereum Sepolia
- Core integration: iExec Nox, ERC-7984, and Safe

## 2. Problem

Public procurement creates a strategic leak: once one vendor's price is visible,
later vendors can copy, undercut, or coordinate around it. Fully private
off-chain procurement avoids public leakage but gives participants weak
settlement guarantees and limited auditability.

VeilBid combines:

- Public tender rules and lifecycle.
- Encrypted vendor prices.
- Confidential on-chain winner selection.
- Proof-derived public award.
- Confidential payment and refund.
- Post-finalization review through a creation-bound wallet and
  vendor-controlled selective disclosure.

## 3. Users

### Primary

- DAO operations teams and Safe treasury owners running vendor procurement.
- Vendors who do not want competitors to see commercial prices.

### Secondary

- Review wallets that need scoped access after finalization.
- Permissionless finalizers who maintain protocol liveness.
- Judges and public observers verifying the lifecycle without a wallet.

## 4. Value proposition

> VeilBid enables a Safe treasury to select and pay the lowest valid vendor bid
> without publishing vendor prices, while preserving public rules, verifiable
> award finalization, and selective audit.

## 5. Public and confidential data

| Data | Visibility |
|---|---|
| Tender ID, buyer, metadata URI/hash | Public |
| Creation-bound review wallet | Public |
| Payment token and public ceiling | Public |
| Approved vendor addresses | Public |
| Bid deadline | Public |
| Bidder addresses and bid count | Public |
| Initial escrow amount | Confirmed equal to the public ceiling before opening |
| Bid price and encrypted validity/candidate state | Confidential |
| Encrypted best price and winner ID before close | Confidential |
| Winning vendor after proof finalization | Public |
| Winning and losing prices | Confidential by default |
| Payment/refund amount handles | Public handles; confidential values |
| Events, status, non-transferable receipt, transaction hashes | Public |

Disclosure policy:

- A vendor receives viewer access to its own stored bid handle.
- The buyer is not an automatic viewer of vendor bid prices while the tender is
  `Open`.
- After proof-derived finalization, the contract automatically grants the
  creation-bound review wallet access to each stored bid handle.
- A vendor may grant a viewer access to its own bid at any time.
- All grants remain per-handle and irreversible for that handle. There is no
  access to accumulator, payment, refund, or unrelated balance handles.

## 6. Core user journeys

### Buyer EOA

1. Connect on Sepolia and obtain enough public Test USDC explicitly. Tender
   creation rejects an over-balance ceiling before any write and never calls
   the faucet automatically.
2. Create a `FundingPending` tender with public ceiling and deadlines.
3. Attempt to escrow the public ceiling through ERC-7984.
4. Generate and submit the public funding-equality proof; only an exactly
   funded tender becomes `Open`.
5. Monitor public bid activity without seeing unauthorized prices.
6. Close after the deadline or immediately when all approved vendors have bid;
   the settlement relay performs this permissionlessly.
7. Verify the proof-derived winner and confidential settlement.
8. Review stored bids after finalization through the automatically authorized
   EOA review wallet.
9. Exit full or custom vcUSDC through the shared EOA balance panel. A full exit
   consumes the encrypted balance handle directly; a custom exit requires a
   session-only reveal. Public-proof finalization returns Test USDC to the EOA
   and makes the amount and recipient public.

### Safe buyer

1. Connect a Sepolia Safe owner and select one of its discovered Safes.
2. Inspect owners, threshold, and the compact confidential vcUSDC balance. Exact
   reveal requires a threshold-authorized per-handle viewer grant.
3. Deposit public test vUSDC from the connected owner wallet directly into the
   selected Safe through the wrapper when funding is needed.
4. In the tender form, approve the one-time module deployment/enablement,
   Market-binding, and operator setup through the existing threshold if the
   selected Safe is not ready.
5. Safe Buyer prepares a target-bound budget handle and tender creation in one
   threshold-authorized batch through the restricted preparation module.
   The connected owner is explicitly bound as the tender's review wallet in
   the same approved calldata.
6. Execute tender creation/funding as a normal Safe transaction satisfying the
   configured owner threshold.
7. Confirm the public exact-funding proof before the tender opens.
8. Settle/refund to the Safe; the browser owner does not become custodian.
   Finalization automatically authorizes that review wallet for stored bids.
9. Exit confidential treasury funds with either a full-handle unwrap or an
   owner-encrypted custom amount to the connected wallet. Both require the
   normal Safe threshold and a separate permissionless public-proof
   finalization; amount and recipient become public at finalization.
10. Manage public ETH/vUSDC and unrelated assets in Safe Wallet rather than
   duplicating a general-purpose treasury interface inside VeilBid.

### Vendor

1. Browse eligible tenders without a wallet.
2. Connect, enter a price, and review privacy/authorization.
3. Encrypt against the market target and submit proof.
4. Reveal only the vendor's own stored bid when needed.
5. If selected, receive confidential payment and a non-transferable award
   receipt minted to the winning vendor address.

### Public finalizer

1. Discover closable or proof-ready tenders.
2. Close the tender and expose only the winner-ID handle for public decryption.
3. Obtain the Nox public-decryption proof.
4. Finalize the proof-derived winner and settlement.
5. Finalize a no-valid-bid tender as a full refund after the winner proof
   establishes the zero sentinel.

## 7. Delivered release scope

### Core protocol and product

- [x] Faucet-backed Sepolia test USDC and official ERC-7984 wrapper.
- [x] EOA and Safe-owned tender funding.
- [x] One confidential price criterion and one payment token.
- [x] One to eight buyer-approved vendor addresses per tender, with one bid per
  approved vendor.
- [x] Escrow exactly the public ceiling so every valid bid is fully funded.
- [x] Encrypted bid validation against zero and public ceiling.
- [x] Encrypted best-price and winner-ID accumulation.
- [x] Permissionless close and proof-based finalize/refund.
- [x] Confidential winner payment and buyer remainder.
- [x] Vendor-controlled reveal and automatic post-finalization review-wallet ACL.
- [x] Wallet-free event-derived tender explorer.
- [x] Award receipt and activity/recovery UI.
- [x] Stateless finalizer with dry-run and bounded actions.
- [x] Responsive, keyboard-operable production frontend.
- [x] Buyer cancellation before the first bid.

### Delivered integrations

- [x] Threshold-bound Safe review-wallet selection at tender creation.
- [x] Read-only MCP tools for tender and proof inspection.

## 8. Non-goals

- Secret bidder identity, tender timing, or transaction graph.
- Multi-criteria quality evaluation in the hackathon release.
- Verification that off-chain services were actually delivered.
- Dispute arbitration or legal enforceability.
- Production-value assets or mainnet deployment.
- Autonomous AI selection, custody, signing, or decryption.
- A database-backed marketplace, KYC system, reputation network, or messaging
  platform.
- Claims of collusion resistance, perfect privacy, or formal audit.

## 9. Core protocol rule

The client may never submit a plaintext winner. The only valid public winner is
the bid index returned by `Nox.publicDecrypt` for the close-time encrypted winner
handle and verified against the stored bid owner.

## 10. Acceptance criteria

| Feature | Completion condition |
|---|---|
| Tender creation | Real Sepolia event; exact-funding proof moves the tender from `FundingPending` to `Open` |
| Vendor admission | Only an approved vendor can submit, at most once |
| Vendor bid | External handle/proof imported and stored without plaintext |
| Winner selection | Nox comparisons/select update encrypted price and ID |
| Public result | On-chain proof verification derives winner ID |
| Settlement | Authorized confidential deltas match winning price and remainder |
| No valid bid | Full confidential refund and terminal status |
| Replay protection | Duplicate close/finalize/settle calls fail safely |
| Safe custody | Wallet deposits mint vcUSDC to the Safe but cannot spend it; tender funding requires a threshold-authorized Safe transaction |
| Selective audit | Grants follow the role, lifecycle, per-handle, and irreversibility rules above |
| Award receipt | One non-transferable receipt is minted to the proof-derived winner |
| Public UX | Lifecycle and proof evidence load without wallet |
| Recovery | A closed tender remains recoverable until proof finalization succeeds |

## 11. Four-minute demo

Use a pre-funded Safe and two prepared vendor wallets:

1. Explain the leak in public procurement.
2. Show public tender terms and Safe custody.
3. Submit one live encrypted bid; show another confirmed bid.
4. Close and finalize the proof-derived winner.
5. Reveal winner payment only to an authorized account.
6. Show automatic post-finalization review ACL, receipt, source/runtime mapping, and sanitized lifecycle
   evidence.

## 12. Approval gate

- [x] User selected VeilBid for detailed planning.
- [x] User approves this release scope and non-goals.
- [x] Mandatory feasibility gates pass.
- [x] Build Plan is approved.
