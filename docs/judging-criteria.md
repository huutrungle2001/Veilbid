# Judging Criteria and Evidence Strategy

## Official rubric

| ID | Criterion | Weight | VeilBid evidence target |
|---|---|---:|---|
| JUD-001 | Creativity | 3/14 | Public winner/private price procurement and selective audit |
| JUD-002 | End-to-end without mock data | 3/14 | Create, fund, bid, close, prove, settle, reveal on Sepolia |
| JUD-003 | Ethereum Sepolia | 2/14 | Live contracts, UI, Safe, and explorer links |
| JUD-004 | `feedback.md` | 2/14 | Specific Nox comparison, ACL, proof, and Safe feedback |
| JUD-005 | Video ≤4 minutes | 2/14 | One concise live lifecycle |
| JUD-006 | Technical implementation | 1/14 | Nox encrypted argmin and ERC-7984 settlement |
| JUD-007 | UX | 1/14 | Clear Public/Safe Buyer/Private Bids/Activity experiences with EOA Buyer as advanced fallback |

## Full-score evidence bar

### Creativity

The differentiator must be explained in one sentence and visible in the demo.
Do not present a generic sealed-bid form: show that the contract maintains an
encrypted best bid and cannot accept a plaintext winner override.

### End-to-end

At least two real vendors submit encrypted bids to one funded tender. A
permissionless account closes/finalizes it. The winner receives a confidential
payment and the buyer receives the confidential remainder. Public evidence must
remain useful without exposing the amounts.

### Sepolia

Publish exact addresses, deployment transactions, creation/runtime source
mapping, initialization transactions, and a read-only verification command.

### Feedback

Feedback must describe VeilBid work, including failures and workarounds. No
external project's implementation history may be relabeled as VeilBid evidence.

### Video and UX

The primary journey must fit comfortably under four minutes. Long proof waits
must have a prepared, truthful recovery path using a previously confirmed
request rather than a mocked completion.

## Point-loss risks

| Risk | Affected criterion | Prevention |
|---|---|---|
| Plaintext winner supplied by UI | Creativity, technical | Winner only from verified public-decryption proof |
| Mock vendor or payment data | End-to-end | Real funded Sepolia wallets and handles |
| Safe shown as branding only | Creativity, technical | Safe owns budget and authorizes restricted module execution |
| Excessive scope delays deployment | End-to-end, Sepolia | Mandatory feasibility gate and tiered milestones |
| Bid values appear in logs/video | UX, trust | Sanitized evidence schema and redaction review |
