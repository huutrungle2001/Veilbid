# Contract Specification

> Status: Production implementation baseline; release-facing interface changes
> require a recorded architecture decision and regression evidence.

## 1. Domain types

### Tender

```text
buyer
paymentToken
metadataHash
publicCeiling
bidDeadline
status
bidCount
encryptedBudget
encryptedFundingCheck
encryptedBestPrice
encryptedWinnerBidId
closeBlock
winnerBidId
winner
```

### Bid

```text
tenderId
vendor
encryptedPrice
submittedAt
status
```

## 2. Tender states

```mermaid
stateDiagram-v2
    [*] --> FundingPending: create + escrow attempt
    FundingPending --> Open: proof confirms exact ceiling
    FundingPending --> Cancelled: proof confirms underfunding
    Open --> Closed: close after bid deadline
    Open --> Cancelled: buyer cancels before first bid
    Closed --> Awarded: valid winner proof + settlement
    Closed --> Refunded: proof establishes no valid bid
    Cancelled --> [*]
    Awarded --> [*]
    Refunded --> [*]
```

No transition leaves a terminal state.

## 3. Implemented external functions

### Market

- `createTender(...)`
- `createTenderAuthorized(...)`
- `confirmTenderFunding(tenderId, fundingProof)`
- `submitBid(tenderId, encryptedPrice, proof)`
- `closeTender(tenderId)`
- `finalizeTender(tenderId, winnerProof)`
- `cancelTender(tenderId)`
- `grantBidViewer(tenderId, bidId, viewer)`
- `getTender(tenderId)`
- `getBid(tenderId, bidId)`
- `canClose(tenderId)`
- `canFinalize(tenderId)`
- `canRefund(tenderId)` — legacy deployed-ABI readiness alias; `true` means the
  tender is closed and can be finalized, not that a standalone refund is
  available. Refund occurs only when the verified winner proof resolves to
  zero.

### Safe module

- `prepareInput(encryptedInput, proof, consumer, actionHash, nonce)`
- `prepareInputForSafe(encryptedInput, proof, inputOwner, consumer, actionDataHash, actionHash, nonce)`
- `consumePreparedInput(actionHash)`
- `configureMarket(market)`
- `computeActionHash(...)`
- no Safe execution function and no arbitrary `execute(address,bytes)`

Preparation requires a current owner of the configured Safe, an allowlisted
consumer, the intended action hash, and an unused nonce. Preparation alone
cannot call the Safe or transfer tokens. The prepared input is consumed once by
the intended market action inside a normal threshold-authorized Safe
transaction.

### Safe module factory

- `deployModule(safe)` — permissionless and idempotent CREATE2 deployment.
- `predictModule(safe)` — deterministic address for the canonical
  Safe/Market/chain tuple.
- `moduleOf(safe)` — deployed canonical module, or zero before deployment.
- `isCanonicalModule(safe, module)` — discovery check only.
- no Safe execution, module enablement/configuration, token-operator, owner, or
  threshold mutation function.

Deploying a module grants no authority. The target Safe must enable and
configure it through a normal transaction satisfying its own threshold.

## 4. Validation

Public validation:

- Nonzero buyer/token and supported token.
- Ceiling within demo bounds.
- Bid deadline is in the future.
- One to eight unique, nonzero approved vendor addresses are fixed at creation.
- Only an approved vendor can submit, exactly once; bids are immutable.
- The escrow transfer attempt is atomic with tender creation, but the tender
  remains `FundingPending`.
- Only a proof-derived true equality between the actual encrypted transfer and
  the public ceiling can move the tender to `Open`.
- A proof-derived false equality moves the unfunded tender to `Cancelled`; no
  bid can be submitted while funding is pending.
- Ceiling fits the selected encrypted unsigned type and `ceiling + 1` cannot
  overflow.
- Only buyer can cancel before first bid.

Encrypted validation:

- Price is greater than zero.
- Price is less than or equal to public ceiling.
- Invalid values select the sentinel rather than reverting on private data.

## 5. Winner selection

For each bid:

1. Import price with target-bound proof.
2. Persist computation access for the market and viewer access for the vendor;
   do not automatically grant the buyer viewer access while `Open`.
3. Build encrypted public handles for zero, ceiling, sentinel, and bid ID.
4. Use nested `Nox.select` to map invalid price to sentinel.
5. Compare candidate with current encrypted best price.
6. Select both new best price and bid ID with the same encrypted condition.
7. Persist accumulator ACL for later transactions.

Do not emit validity or comparison result.

Viewer grants:

- Always target one stored bid handle; there is no tender-wide grant.
- The bid vendor may grant a nonzero viewer access to its own bid at any time.
- The tender buyer may grant a nonzero viewer only after the tender leaves
  `Open`.
- A Safe buyer must authorize the grant through a normal threshold-approved Safe
  transaction.
- The function cannot grant access to accumulator, budget, payment, or refund
  handles.
- Grants are irreversible for the current handle and emit `ViewerGranted`.

## 6. Close and finalize

`closeTender`:

- Requires `Open` and either the bid deadline passed or every approved vendor
  slot has submitted a bid.
- Freezes bid submissions.
- Stores close block/time.
- Marks only encrypted winner bid ID publicly decryptable.
- Changes status to `Closed`.

`finalizeTender`:

- Requires `Closed`.
- Verifies proof against the stored encrypted winner ID.
- Binds nonzero ID to a real bid in this tender.
- Uses stored vendor only; ignores caller-supplied addresses.
- Settles confidential winning price and remainder, or full refund for zero ID.
- Updates terminal status before external token callbacks.
- Mints one non-transferable receipt to the stored winning vendor only for
  `Awarded`, using a non-callback mint.

There is no timeout refund after close. A closed tender remains recoverable until
the Nox public-decryption proof becomes available. This intentionally favors
award fairness over fund liveness during a Nox outage.

## 7. Invariants

- Escrowed budget equals the public ceiling.
- Sum of confidential winner payment and buyer refund equals the public ceiling.
- At most one terminal settlement per tender.
- Winner is always the owner of the proof-derived bid ID.
- A zero/over-ceiling bid cannot be selected.
- A valid lower bid replaces a higher bid.
- Equal valid bids preserve deterministic first-submission priority.
- Only approved vendors have bid slots, and each can submit at most once.
- Public finalizers cannot cancel, change terms, or decrypt prices.
- Module preparation alone cannot transfer Safe funds.
- No module function can execute a transaction from the Safe.
- Award receipt ownership always equals the stored winning vendor; transfers and
  approvals are disabled.
- Contract source contains no plaintext bid mapping.

## 8. Events

Events expose public coordination only:

- `TenderCreated`
- `TenderFunded`
- `BidSubmitted`
- `TenderClosed`
- `TenderAwarded`
- `TenderRefunded`
- `TenderCancelled`
- `ViewerGranted`
- `AwardReceiptMinted`

Events do not include encrypted handles, proofs, bid prices, or confidential
balance/payment values. Automation logs and evidence must preserve the same
boundary.

## 9. Reentrancy and external calls

- Use checks-effects-interactions and reentrancy guards on lifecycle writes.
- Update terminal state before ERC-7984 transfers.
- Canonical asset allowlist contains only reviewed wrappers.
- Receipt minting uses a non-callback mint so a contract vendor cannot block
  settlement. Transfer and approval entry points revert because the receipt is
  an immutable award record, not a tradable asset.

## 10. Upgrade and administration

Hackathon contracts should be non-upgradeable unless a concrete requirement
justifies upgradeability. Ownership must not provide an arbitrary withdrawal or
winner override. Admin capabilities and compromise impact must be documented.
