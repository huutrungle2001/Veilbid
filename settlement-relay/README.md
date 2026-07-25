# Settlement Relay

Stateless, permissionless close, public-proof, finalize, and refund automation.
It uses public chain state only and does not hold private decryption or buyer
authority.

The core planner prioritizes proof-ready `finalize` actions, then expired
`close` actions. The runner processes actions sequentially under one shared
budget, rereads state before each action, and classifies a failed competing
write as a benign race only after another canonical state read confirms that
the action was resolved.

Structured results contain only the action kind, public tender ID, outcome,
public transaction hash, and an allowlisted reason code. Handles, proofs,
private keys, plaintext bids, balances, and raw provider errors are excluded.
