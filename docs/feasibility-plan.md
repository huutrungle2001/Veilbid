# Feasibility and Kill-Criteria Plan

> Status: Mandatory pre-build gate. No result is currently claimed.

## 1. Purpose

VeilBid depends on encrypted state surviving multiple transactions and crossing
Nox/ERC-7984/Safe boundaries. These assumptions must be proven before building
the full UI.

Use the exact intended package versions:

- `@iexec-nox/nox-protocol-contracts@0.2.4`
- `@iexec-nox/nox-confidential-contracts@0.2.2`
- `@iexec-nox/handle@0.1.0-beta.13`
- Solidity `0.8.35`
- Hardhat 3 on Node 24

Change versions only through a recorded decision and regression run.

## 1.1 Execution boundary

After Product Plan approval, run these spikes in the isolated `feasibility/`
workspace. It contains no production deployment, generated consumer artifact,
frontend, relay, MCP, or submission claim. Production workspaces remain absent
until Gates A–D pass and the custody architecture is selected.

## 2. Gate A — persistent encrypted bid state

Prove:

1. An EOA encrypts a price against a spike contract.
2. The contract imports it with `Nox.fromExternal`.
3. The contract persists the required ACL.
4. A later transaction compares the stored handle with a public encrypted value.
5. The vendor can decrypt its stored value after indexing.

Pass evidence:

- Local Nox runtime test.
- Sepolia transaction pair separated by at least one block.
- ACL inspection before and after.
- Plaintext assertion redacted from saved evidence.

Kill condition:

- Stored bid handles cannot be safely reused across transactions with a
  documented ACL pattern.

## 3. Gate B — encrypted argmin and winner ID

Implement a minimal two-to-eight-bid accumulator:

```text
candidate = price if price > 0 else ceiling + 1
candidate = candidate if price <= ceiling else ceiling + 1
isBetter = candidate < encryptedBestPrice
encryptedBestPrice = select(isBetter, candidate, encryptedBestPrice)
encryptedWinnerId = select(isBetter, encryptedBidId, encryptedWinnerId)
```

Prove:

- Lowest valid bid wins.
- Zero and over-ceiling bids do not win.
- Earlier bid wins deterministic ties.
- Bid order permutations preserve the expected minimum.
- No plaintext bid or winner shadow state exists.

Kill condition:

- Correct encrypted selection requires client-calculated plaintext branching.

## 4. Gate C — public winner proof and recovery

Prove:

1. Close marks only the encrypted winner ID publicly decryptable.
2. Handle SDK returns plaintext winner ID plus proof.
3. Contract verifies the proof with `Nox.publicDecrypt`.
4. Incorrect value/proof, wrong tender, and replay fail.
5. A mined close can be resumed after reload when proof generation is delayed.

The best price must not be marked publicly decryptable.

Kill condition:

- Winner proof cannot be reliably bound to one tender/close state or safely
  retried.

## 5. Gate D — confidential escrow settlement

Prove with official ERC-7984 wrapper:

1. Buyer escrows an encrypted budget.
2. Market/escrow can consume the encrypted winning-price handle.
3. Winner receives exactly that confidential amount.
4. Buyer receives exactly the encrypted remainder.
5. No-valid-bid path returns the full budget.
6. Double settlement cannot change balances.

Test both:

- Single-contract market/escrow.
- Split market and escrow contracts with explicit transient ACL.

Choose the simpler architecture unless the split version provides measurable
security or maintainability benefit without increasing failure risk.

Kill condition:

- Exact settlement requires public decryption of the price.

## 6. Gate E — Safe composability

This is mandatory for the product but may run after Gates A–D:

- Deploy a separate Sepolia Safe and restricted VeilBid module.
- Owner prepares a budget/tender input handle against the module.
- Module grants only the approved market/escrow access.
- The module exposes no Safe execution function; preparing the handle alone
  cannot move funds.
- A normal Safe transaction satisfying the configured threshold consumes the
  prepared input and funds a tender.
- Prepared inputs are bound to the Safe, chain, action, approved consumer, and a
  one-time nonce; cross-action and replay attempts fail.
- Revoking the module prevents new preparation without moving Safe balances or
  changing owners.

If browser-based higher-threshold signing is not implemented, use a 1-of-1 demo
Safe and document higher-threshold execution through Safe Wallet.

## 7. Decision record

| Gate | Status | Evidence | Decision |
|---|---|---|---|
| A. Persistent bid | Blocked | `evidence/local/gate-a.json` | Contract and integration test compile; official local run requires Docker and live run requires Sepolia configuration. |
| B. Encrypted argmin | Blocked | `evidence/local/gate-b.json` | Contract compiles and 2,000 deterministic model cases pass; encrypted runtime assertions require Docker. |
| C. Public winner proof | Pending |  |  |
| D. Confidential settlement | Pending |  |  |
| E. Safe composability | Pending |  |  |

Full application development starts only after A–D pass and the Safe design for
E is approved.
