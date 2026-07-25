# VeilBid Product Plan

> Status: Draft for user approval.

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
- Selective disclosure to buyer, vendor, or auditor.

## 3. Users

### Primary

- DAO operations teams and Safe treasury owners running vendor procurement.
- Vendors who do not want competitors to see commercial prices.

### Secondary

- Auditors who need scoped access to selected bids.
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
| Payment token and public ceiling | Public |
| Bid and settlement deadlines | Public |
| Bidder addresses and bid count | Public |
| Bid price and encrypted validity/candidate state | Confidential |
| Encrypted best price and winner ID before close | Confidential |
| Winning vendor after proof finalization | Public |
| Winning and losing prices | Confidential by default |
| Payment/refund amount handles | Public handles; confidential values |
| Events, status, receipt, transaction hashes | Public |

## 6. Core user journeys

### Buyer EOA

1. Connect on Sepolia and obtain/wrap test USDC.
2. Create a tender with public ceiling and deadlines.
3. Encrypt and escrow the budget.
4. Monitor public bid activity without seeing unauthorized prices.
5. Close or let a finalizer close after deadline.
6. Verify the proof-derived winner and confidential settlement.
7. Reveal authorized data or grant an auditor.

### Safe buyer

1. Connect a configured Safe owner.
2. Inspect owners, threshold, module, operator, and confidential balance.
3. Prepare the budget handle through a restricted module.
4. Execute tender creation/funding through Safe authority.
5. Settle/refund to the Safe; the browser owner does not become custodian.

### Vendor

1. Browse eligible tenders without a wallet.
2. Connect, enter a price, and review privacy/authorization.
3. Encrypt against the market target and submit proof.
4. Reveal only the vendor's own stored bid when needed.
5. If selected, receive confidential payment and award receipt.

### Public finalizer

1. Discover closable or proof-ready tenders.
2. Close the tender and expose only the winner-ID handle for public decryption.
3. Obtain the Nox public-decryption proof.
4. Finalize the proof-derived winner and settlement.
5. Refund a no-valid-bid or expired tender.

## 7. MVP

### Must have

- [ ] Faucet-backed Sepolia test USDC and official ERC-7984 wrapper.
- [ ] EOA and Safe-owned tender funding.
- [ ] One confidential price criterion and one payment token.
- [ ] At most eight bids per tender for bounded demo/test behavior.
- [ ] Encrypted bid validation against zero and public ceiling.
- [ ] Encrypted best-price and winner-ID accumulation.
- [ ] Permissionless close and proof-based finalize/refund.
- [ ] Confidential winner payment and buyer remainder.
- [ ] Buyer/vendor authorized reveal and auditor ACL.
- [ ] Wallet-free event-derived tender explorer.
- [ ] Award receipt and activity/recovery UI.
- [ ] Stateless finalizer with dry-run and bounded actions.
- [ ] Responsive, keyboard-operable production frontend.

### Should have

- [ ] Batch Safe input/viewer preparation.
- [ ] Public finalizer health surfaced in the UI.
- [ ] Read-only MCP tools for tender and proof inspection.
- [ ] Strict-schema Strategy Assistant for public tender drafting.

### Could have

- [ ] Vendor public bond.
- [ ] Buyer cancellation before the first bid.
- [ ] Multiple procurement categories or metadata templates.
- [ ] Webhook notification from the finalizer.

## 8. Non-goals

- Secret bidder identity, tender timing, or transaction graph.
- Multi-criteria quality evaluation in the hackathon MVP.
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
| Tender creation | Real Sepolia event and funded confidential escrow |
| Vendor bid | External handle/proof imported and stored without plaintext |
| Winner selection | Nox comparisons/select update encrypted price and ID |
| Public result | On-chain proof verification derives winner ID |
| Settlement | Authorized confidential deltas match winning price and remainder |
| No valid bid | Full confidential refund and terminal status |
| Replay protection | Duplicate close/finalize/settle calls fail safely |
| Safe custody | Safe owns funds; owner/module preparation cannot bypass threshold |
| Selective audit | Explicit viewer can decrypt selected handle only |
| Public UX | Lifecycle and proof evidence load without wallet |
| Recovery | Proof/indexing delay survives reload and can be retried |

## 11. Four-minute demo

Use a pre-funded Safe and two prepared vendor wallets:

1. Explain the leak in public procurement.
2. Show public tender terms and Safe custody.
3. Submit one live encrypted bid; show another confirmed bid.
4. Close and finalize the proof-derived winner.
5. Reveal winner payment only to an authorized account.
6. Show auditor ACL, receipt, Etherscan, and encrypted handles.

## 12. Approval gate

- [x] User selected VeilBid for detailed planning.
- [ ] User approves this MVP and non-goals.
- [ ] Mandatory feasibility gates pass.
- [ ] Build Plan is approved.

