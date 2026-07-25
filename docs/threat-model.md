# VeilBid Threat Model

> Scope: planned Ethereum Sepolia hackathon deployment. Update with exact
> addresses and implemented behavior before release.

## 1. Security objectives

VeilBid aims to:

- Keep bid prices out of plaintext calldata, storage, events, and public logs.
- Select the lowest valid bid using Nox confidential computation.
- Prevent buyer, vendor, finalizer, or UI from substituting a plaintext winner.
- Pay the proof-derived winner and refund the buyer exactly once.
- Preserve Safe ownership and threshold authority over treasury funds.
- Allow narrow, explicit viewer disclosure without granting spend authority.
- Keep keys, signatures, proofs, and plaintext values out of public evidence.

## 2. Assets and visibility

| Asset/data | Visibility | Authorized controller/viewer |
|---|---|---|
| Vendor price | Encrypted handle public; value private | Vendor, approved buyer/contract, explicit viewers |
| Best price | Encrypted | Market and intended settlement contracts |
| Winner bid ID before close | Encrypted | Market |
| Winner bid ID after close | Publicly decryptable | Everyone after valid proof |
| Winning vendor after finalize | Public | Everyone |
| ERC-7984 balances/payments | Handle public; value private | Holder and explicit viewers |
| Tender metadata/ceiling/deadlines | Public | Everyone |
| Bidder addresses/timing/count | Public | Everyone |
| Safe owners/threshold/module | Public | Everyone |
| Revealed plaintext | Browser session | Authorizing wallet/browser |

The system does not hide bidder identity, network metadata, timing, participation,
or the final winner.

## 3. Trust boundaries

### Wallet/browser

Wallets authorize writes and reveals. A compromised browser can observe inputs
before encryption and plaintext after authorized reveal. VeilBid cannot protect
against endpoint compromise.

### Nox services

Gateway, KMS, runner, indexer/subgraph, and confidential runtime are part of the
confidentiality/correctness boundary. Contracts enforce ACL/proof rules, but
availability and confidential evaluation depend on the deployed Nox services.

### Contracts

Contracts are canonical for tender status, bidder ownership, proof binding, and
settlement. They are unaudited during the hackathon and must not custody valuable
assets.

### Safe module

The module is trusted only for its reviewed allowlist. Compromise or an overly
broad selector/target policy could spend Safe assets. The Safe itself remains the
authority; input preparation alone must not move funds.

### RPC and finalizer

RPC can lie or delay but cannot sign. A finalizer is an untrusted permissionless
caller and can choose timing or waste its own gas; it cannot choose the winner or
decrypt prices.

### Assistant and MCP

The assistant receives public/user-entered tender text only and has no signing
authority. MCP is read-only by default; an explicitly configured signer has the
same risk as that wallet.

## 4. Threats and mitigations

| Threat | Mitigation | Residual risk |
|---|---|---|
| Later vendor copies earlier price | Prices are encrypted handles | Timing and bidder identity remain public |
| UI submits favored winner | Winner derived only from stored public-decryption proof | Nox/contract correctness is trusted |
| Invalid zero/over-ceiling bid wins | Encrypted validity maps it to sentinel | Comparison implementation may contain bugs |
| Buyer withholds close | Close/finalize/refund are permissionless | Proof service outage delays liveness |
| Double settlement/replay | Terminal state before external calls and proof binding | Unaudited contract bugs |
| Malicious token callback | Canonical wrapper allowlist, guard, checks-effects-interactions | Wrapper/Nox compromise |
| Finalizer logs confidential material | Sanitized schema excludes handles/proofs/plaintext/keys | Host compromise |
| ACL grant leaks a bid | Explicit per-handle viewer grant and confirmation | Grants may be irreversible for the current handle |
| Indexing delay appears as failure | Bounded retry and recoverable pending state | Extended service outage |
| Buyer Safe module overreach | Fixed Safe, target, token, consumer, selector allowlists | Module bug or owner compromise |
| Metadata leaks commercial intent | UI explicitly labels public fields | Inference remains possible |
| Prompt leaks confidential price | Field allowlist and warning | User can manually type a secret |
| Bid spam | Eight-bid cap and optional bond | Public identities can rotate |
| Tie manipulation | Deterministic first-valid-bid rule | Transaction ordering remains public |

## 5. Compromise impact

- Vendor wallet: attacker can submit/reveal as that vendor and spend its assets.
- Buyer wallet: attacker can create/cancel where allowed and reveal buyer-viewable
  bids; cannot override proof-derived winner.
- Safe owner: impact depends on threshold and module permissions.
- Market owner/admin: must not have arbitrary withdrawal or winner override;
  any remaining privilege is documented before deploy.
- Finalizer: attacker can spend finalizer gas and race public actions only.
- Nox infrastructure: encrypted confidentiality/correctness may fail.
- Wrapper: collateral and reusable approvals may be at risk.
- RPC: clients may see stale/misleading state; signing remains local.

## 6. Operational requirements

- Use funded test wallets only.
- Redact plaintext bid/payment/refund values from evidence.
- Keep write-enabled live tests manual or secret-protected.
- Verify chain ID, bytecode, receipts, events, proof binding, and exact in-memory
  confidential balance deltas.
- Treat Nox failure as infrastructure failure, not permission to use a mock.
- Revoke unused operators and Safe modules after demos.

## 7. Out of scope

- Mainnet value and production key custody.
- Vendor identity privacy.
- Off-chain service delivery and legal disputes.
- Sybil, collusion, bribery, or transaction-ordering elimination.
- Formal security/economic audit.

