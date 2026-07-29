# Security Policy

VeilBid is unaudited, testnet-only hackathon software. Do not use it with
mainnet keys, production funds, valuable assets, or operational procurement.

## Supported release

Only the verified Ethereum Sepolia release recorded in
`packages/contracts/deployments/sepolia.release.json` is supported. Historical
and test manifests are retained for reproducibility but are not production
targets.

## Reporting

Report a suspected vulnerability privately through GitHub's security-advisory
workflow for this repository. Do not open a public issue containing:

- Private keys, seed phrases, wallet signatures, or RPC credentials.
- Plaintext bids or confidential balances.
- Encrypted handles, proof bytes, or private reveal material.
- An exploit against a live test wallet before maintainers can contain it.

Include the affected commit, contract or component, chain ID, public transaction
hash when safe, reproduction steps, and expected impact. Use only disposable
Sepolia accounts when reproducing.

## Scope

Security objectives, trust assumptions, compromise impact, and residual risks
are documented in [`docs/threat-model.md`](docs/threat-model.md). In particular:

- Nox services are part of the confidentiality, correctness, and availability
  boundary.
- Bidder identity, participation, metadata, timing, and transaction graph are
  public.
- A public-proof outage can keep a closed escrow locked until recovery.
- Contracts are non-upgradeable and have not received an independent audit.

The repository's evidence policy forbids confidential plaintext, handles,
proofs, signatures, and keys in committed artifacts.
