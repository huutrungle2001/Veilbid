# Contract Specification

> Status: Pre-implementation specification; interfaces may change through a
> recorded architecture decision.

## 1. Domain types

### Tender

```text
buyer
receiptOwner
paymentToken
metadataHash
publicCeiling
bidDeadline
status
bidCount
encryptedBudget
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
    [*] --> Open: create + fund
    Open --> Closed: close after bid deadline
    Open --> Cancelled: buyer cancels before first bid
    Closed --> Awarded: valid winner proof + settlement
    Closed --> Refunded: proof establishes no valid bid
    Cancelled --> [*]
    Awarded --> [*]
    Refunded --> [*]
```

No transition leaves a terminal state.

## 3. Proposed external functions

### Market

- `createTender(...)`
- `createTenderAuthorized(...)`
- `submitBid(tenderId, encryptedPrice, proof)`
- `closeTender(tenderId)`
- `finalizeTender(tenderId, winnerBidId, winnerProof)`
- `cancelTender(tenderId)`
- `grantBidViewer(tenderId, bidId, viewer)`
- `grantTenderViewer(tenderId, viewer)`
- `getTender(tenderId)`
- `getBid(tenderId, bidId)`
- `canClose(tenderId)`
- `canFinalize(tenderId)`
- `canRefund(tenderId)`

### Safe module

- `prepareInput(encryptedInput, proof, consumer)`
- `prepareInputs(encryptedInputs, proofs, consumers)`
- reviewed wrappers for create/fund/cancel/viewer actions
- no arbitrary `execute(address,bytes)`

## 4. Validation

Public validation:

- Nonzero buyer/token and supported token.
- Ceiling within demo bounds.
- Bid deadline is in the future.
- One to eight unique, nonzero approved vendor addresses are fixed at creation.
- Only an approved vendor can submit, exactly once; bids are immutable.
- Escrow amount equals the public ceiling and is transferred atomically with
  tender creation.
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
2. Persist market, vendor, and approved buyer ACL as specified.
3. Build encrypted public handles for zero, ceiling, sentinel, and bid ID.
4. Use nested `Nox.select` to map invalid price to sentinel.
5. Compare candidate with current encrypted best price.
6. Select both new best price and bid ID with the same encrypted condition.
7. Persist accumulator ACL for later transactions.

Do not emit validity or comparison result.

## 6. Close and finalize

`closeTender`:

- Requires `Open` and bid deadline passed.
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
- Mints receipt only for `Awarded`.

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

Events may include encrypted handle fingerprints only when useful for proof
inspection. Logs and webhook payloads must not repeat complete proof bytes.

## 9. Reentrancy and external calls

- Use checks-effects-interactions and reentrancy guards on lifecycle writes.
- Update terminal state before ERC-7984 transfers or NFT callbacks.
- Canonical asset allowlist contains only reviewed wrappers.
- Receipt minting must not allow an incompatible Safe receiver to block
  settlement; use a verified EOA receipt owner or a non-callback mint pattern.

## 10. Upgrade and administration

Hackathon contracts should be non-upgradeable unless a concrete requirement
justifies upgradeability. Ownership must not provide an arbitrary withdrawal or
winner override. Admin capabilities and compromise impact must be documented.
