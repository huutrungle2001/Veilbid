import type { PublicBid, PublicTender } from "@veilbid/chain-bindings";
import { DisclosurePanel } from "../disclosure/DisclosurePanel";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";
import { BuyerTenderForm } from "./BuyerTenderForm";
import { VendorBidForm } from "./VendorBidForm";
import { ContextHelp } from "../shell/ContextHelp";

export type InteractiveRole = "BUYER" | "VENDOR";

export function RoleWorkspace({
  role,
  wallet,
  tenders,
  bids,
  onRefresh,
}: {
  role: InteractiveRole;
  wallet: WalletController;
  tenders: readonly PublicTender[];
  bids: readonly PublicBid[];
  onRefresh: () => void;
}) {
  const buyer = role === "BUYER";
  return (
    <main className="role-workspace" id="main-content">
      <section className="workspace-intro">
        <ContextHelp
          label={`Help for ${role.toLowerCase()} workspace`}
          title={buyer ? "HOW TO USE BUYER" : "HOW TO USE VENDOR"}
          steps={
            buyer
              ? [
                  "Connect the Sepolia wallet that will own the tender.",
                  "Enter public metadata, the vUSDC ceiling, a future deadline, and 1–8 approved vendor addresses.",
                  "Confirm the guided faucet, wrap, approval, funding-proof, and opening transactions in order.",
                  "If proof recovery is interrupted, resume it from Activity instead of recreating the tender.",
                ]
              : [
                  "Connect the exact Sepolia account approved by the buyer.",
                  "Select an Open tender and enter a private price no higher than its public ceiling.",
                  "Confirm encryption, simulation, and the bid transaction; the plaintext stays in this browser session.",
                  "Use Selective Disclosure only when you intentionally want to reveal or grant access to your stored bid.",
                ]
          }
          note={
            buyer
              ? "Tender terms and vendor addresses are public; escrow and bid values remain confidential."
              : "Each approved vendor submits one immutable encrypted bid before the deadline."
          }
        />
        <p className="eyebrow">{role} / SEPOLIA TEST WORKSPACE</p>
        <h1>
          {buyer ? "Fund public terms." : "Submit a sealed price."}
        </h1>
        <p>
          {buyer
            ? "Create an exactly funded tender without gaining access to open vendor prices."
            : "Encrypt the bid in your wallet session for the selected market target before any transaction is signed."}
        </p>
      </section>
      <WalletPanel wallet={wallet} />
      {buyer && (
        <BuyerTenderForm wallet={wallet} onConfirmed={onRefresh} />
      )}
      {!buyer && (
        <VendorBidForm
          wallet={wallet}
          tenders={tenders}
          onConfirmed={onRefresh}
        />
      )}
      <DisclosurePanel
        role={role}
        wallet={wallet}
        tenders={tenders}
        bids={bids}
        onConfirmed={onRefresh}
      />
      <section className="journey-preview">
        <p className="eyebrow">TRANSACTION STAGES</p>
        <ol>
          {(buyer
            ? [
                "Acquire and wrap test vUSDC",
                "Approve market operator",
                "Create funded tender",
                "Recover exact-funding proof",
                "Open tender on-chain",
              ]
            : [
                "Verify vendor admission",
                "Encrypt price for market",
                "Simulate bid transaction",
                "Sign and confirm on-chain",
                "Refresh confirmed dossier",
              ]
          ).map((stage, index) => (
            <li key={stage}>
              <span>{index + 1}</span>
              {stage}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
