import type { PublicBid, PublicTender } from "@veilbid/chain-bindings";
import { DisclosurePanel } from "../disclosure/DisclosurePanel";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";
import { BuyerTenderForm } from "./BuyerTenderForm";
import { VendorBidForm } from "./VendorBidForm";
import { ContextHelp } from "../shell/ContextHelp";
import { GrantedAccessPanel } from "../auditor/AuditorWorkspace";

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
          label={`Help for ${buyer ? "EOA Buyer" : "Private Bids"} workspace`}
          title={buyer ? "HOW TO USE EOA BUYER" : "HOW TO USE PRIVATE BIDS"}
          steps={
            buyer
              ? [
                  "Connect the Sepolia wallet that will own the tender.",
                  "Enter public metadata, the vUSDC ceiling, a future deadline, and 1–8 approved vendor addresses.",
                  "Confirm the guided faucet, wrap, operator approval, and creation transactions in order.",
                  "The relay confirms exact funding and opens the tender; Activity remains a manual recovery path.",
                ]
              : [
                  "Connect the exact Sepolia account approved by the buyer.",
                  "Select an Open tender and enter a private price no higher than its public ceiling.",
                  "Confirm encryption, simulation, and the bid transaction; the plaintext stays in this browser session.",
                  "Use My Bid to reveal or share your own bid, and Granted Access for bids shared with this wallet.",
                ]
          }
          note={
            buyer
              ? "Tender terms and vendor addresses are public; escrow and bid values remain confidential."
              : "Each approved vendor submits one immutable encrypted bid before the deadline."
          }
        />
        <p className="eyebrow">{buyer ? "EOA BUYER / ADVANCED FALLBACK" : "PRIVATE BIDS / VENDOR & REVIEWER"}</p>
        <h1>
          {buyer ? "Fund public terms." : "Submit or privately review bids."}
        </h1>
        <p>
          {buyer
            ? "Create an exactly funded tender without gaining access to open vendor prices."
            : "Vendors manage their own sealed bid here. Review wallets reveal only bids authorized after finalization or explicitly shared by a Vendor."}
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
      {!buyer && (
        <>
          <DisclosurePanel
            role={role}
            wallet={wallet}
            tenders={tenders}
            bids={bids}
            onConfirmed={onRefresh}
          />
          <GrantedAccessPanel wallet={wallet} tenders={tenders} bids={bids} />
        </>
      )}
      <section className="journey-preview">
        <p className="eyebrow">TRANSACTION STAGES</p>
        <ol>
          {(buyer
            ? [
                "Acquire and wrap test vUSDC",
                "Approve market operator",
                "Create funded tender",
                "Relay verifies exact funding",
                "Relay opens tender on-chain",
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
