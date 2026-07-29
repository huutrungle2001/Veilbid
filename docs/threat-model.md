# VeilBid Threat Model

> Scope: canonical, verified Ethereum Sepolia hackathon release recorded in
> `packages/contracts/deployments/sepolia.release.json`. This remains unaudited,
> testnet-only software.

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
| Vendor price | Encrypted handle public; value private | Vendor, market computation, vendor-granted viewers, and creation-bound review wallet after finalization |
| Best price | Encrypted | Market and intended settlement contracts |
| Winner bid ID before close | Encrypted | Market |
| Winner bid ID after close | Publicly decryptable | Everyone after valid proof |
| Winning vendor after finalize | Public | Everyone |
| ERC-7984 balances/payments | Handle public; value private | Holder and explicit viewers |
| Tender metadata/ceiling/deadlines | Public | Everyone |
| Approved vendor addresses | Public | Everyone |
| Tender review wallet | Public | Everyone |
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

Each factory-created module is bound to one Safe and the canonical Market. The
module is a preparation-only boundary (including a Safe-only atomic preparation
entrypoint) and has no Safe execution function. A compromise can prepare or
leak incorrectly scoped handles, but cannot move Safe assets without a normal
transaction satisfying the Safe threshold. The Safe remains the spending
authority.

The factory is permissionless because deployment itself grants no authority.
It can deploy only the reviewed module bytecode at the deterministic address
for a given Safe/Market pair. It cannot enable/configure the module, authorize
the Market, execute from the Safe, or alter Safe ownership/threshold.

### RPC and finalizer

RPC can lie or delay but cannot sign. A finalizer is an untrusted permissionless
caller and can choose timing or waste its own gas; it cannot choose the winner or
decrypt prices.

### MCP

MCP is strictly read-only and exposes no signer, transaction, custody,
decryption, or raw-handle surface.

## 4. Threats and mitigations

| Threat | Mitigation | Residual risk |
|---|---|---|
| Later vendor copies earlier price | Prices are encrypted handles | Timing and bidder identity remain public |
| UI submits favored winner | Winner derived only from stored public-decryption proof | Nox/contract correctness is trusted |
| Invalid zero/over-ceiling bid wins | Encrypted validity maps it to sentinel | Comparison implementation may contain bugs |
| Underfunded transfer appears funded | Tender remains `FundingPending` until a public proof confirms encrypted transferred amount equals the public ceiling | Proof-service outage delays opening |
| Buyer withholds close | Close/finalize are permissionless | Proof service outage locks a closed escrow until recovery |
| Double settlement/replay | Terminal state before external calls and proof binding | Unaudited contract bugs |
| Malicious token callback | Canonical wrapper allowlist, guard, checks-effects-interactions | Wrapper/Nox compromise |
| Finalizer logs confidential material | Sanitized schema excludes handles/proofs/plaintext/keys | Host compromise |
| Buyer/reviewer inspects bids before finalize | Review wallet receives no cross-bid ACL while `Open` or `Closed` | Vendor can voluntarily disclose its own bid |
| Automatic review ACL leaks a bid too early | Review wallet is fixed at creation; ACL is added only after verified terminal state | Grants are irreversible and the chosen review wallet may later be compromised |
| Indexing delay appears as failure | Bounded retry and recoverable pending state | Extended service outage |
| Buyer Safe module overreach | Preparation-only API, fixed Safe/consumer/action binding, one-time nonce, and no Safe execution call | Handle ACL leakage or owner compromise |
| Attacker deploys a module for another Safe | Factory deployment is deterministic but inert until that Safe enables/configures it through its own threshold | Address squatting is prevented by CREATE2; factory/bytecode bugs remain unaudited |
| Browser recovers pending Safe proposals | Local storage contains only public Safe address, Safe transaction hash, action kind, and timestamp | Browser compromise can observe public workflow metadata |
| Safe owner requests confidential balance reveal | Safe threshold grants viewer access only to the connected owner and current balance handle | Viewer access is irreversible for that handle; a compromised authorized owner can decrypt it |
| Safe vcUSDC unwrap targets the wrong recipient | UI fixes and displays the recipient as the connected wallet; normal Safe threshold remains mandatory | A compromised or mistakenly selected connected account can still receive an approved unwrap |
| Safe vcUSDC unwrap changes privacy | UI uses one amount field with an explicit Full shortcut, requires private balance reveal only for a custom amount, and warns before the Safe proposal | Finalized unwrap amount and recipient are public by wrapper design |
| Partial unwrap proof is replayed or prepared against stale funds | Adapter binds the owner proof to the calling Safe, fresh nonce, one-time handle, current balance handle, and transaction-scoped Nox access | Nox, wrapper, adapter, or Safe bugs remain unaudited |
| Metadata leaks commercial intent | UI explicitly labels public fields | Inference remains possible |
| Bid-slot exhaustion | Fixed one-to-eight-address vendor allowlist and one immutable bid per approved vendor | An approved vendor can waste only its own slot |
| Tie manipulation | Deterministic first-valid-bid rule | Transaction ordering remains public |
| Receipt is transferred or presented as another vendor's award | Non-transferable receipt is minted once to the proof-derived winner | Wallet compromise can still control the winner address |

## 5. Compromise impact

- Vendor wallet: attacker can submit/reveal as that vendor and spend its assets.
- Buyer/review wallet: attacker can create/cancel where allowed and inspect bids
  after finalization; cannot inspect cross-vendor bids through review authority
  before finalization or override the proof-derived winner.
- Safe owner: one compromised owner can prepare inputs but cannot move Safe
  assets unless the Safe threshold is also satisfied.
- Market owner/admin: must not have arbitrary withdrawal or winner override;
  any remaining privilege is documented before deploy.
- Finalizer: attacker can spend finalizer gas and race public actions only.
- Nox infrastructure: encrypted confidentiality/correctness may fail.
- Nox public-decryption outage: a closed tender and its escrow remain locked
  until proof service recovers; there is no buyer timeout escape after close.
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
