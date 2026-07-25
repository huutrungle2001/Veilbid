# Discord Context Extract

Source type: User-provided transcript

Captured from: user-supplied `chat.txt`

Reviewed: 2026-07-25

This is not an independently authenticated organizer record. It preserves only
messages relevant to VeilBid planning.

## Ethereum Sepolia and package version

A participant reported that an older `Nox.sol` reverted on Ethereum Sepolia.
An account identified in the transcript as iExec staff replied that:

- Ethereum Sepolia (`11155111`) is supported.
- The current `@iexec-nox/nox-protocol-contracts` release was `0.2.4`.
- The current `Nox.sol` resolves Ethereum Sepolia to NoxCompute
  `0x24Ef36Ec5b626D7DCD09a98F3083c2758F0F77bF`.
- Builders should remain on Ethereum Sepolia rather than switch to Arbitrum
  Sepolia.

VeilBid must verify installed package source and the live address before deploy.

## Composability guidance

A participant asked whether a Nox-native AMM qualified or whether the path must
compose directly with an existing protocol. An account identified as iExec staff
replied:

> The best approach is to integrate Nox on top of an existing open-source
> protocol to demonstrate composability. Innovative integrations may also work.

VeilBid therefore makes Safe treasury ownership and authorization part of the
core workflow.

## Submission

An account identified as iExec DevRel warned that:

- Builders should read and use the DoraHacks submission details.
- Missing the required X post can cause disqualification.

The user separately confirmed on 2026-07-25 that multiple independent products
may be submitted.

## Video guidance

An account identified as iExec staff stated that a real-person demo is preferred.
A clear, detailed, well-produced generated animation may be accepted.

VeilBid plans a real-person walkthrough.

## Community technical warning

A participant reported:

> A contract could mint itself confidential tokens, but reusing that balance in
> a later transfer reverted with `NotAllowed`; the token contract lacked access
> to its own minted handle.

This report was awaiting/received technical-ticket handling in the transcript.
It is not treated as a confirmed protocol defect. VeilBid nevertheless includes
a mandatory cross-transaction handle/ACL feasibility test and avoids relying on
self-minted confidential balance reuse.
