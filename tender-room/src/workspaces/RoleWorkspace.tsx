import { WalletPanel, type WalletController } from "../wallet/WalletPanel";

export type InteractiveRole = "BUYER" | "VENDOR";

export function RoleWorkspace({
  role,
  wallet,
}: {
  role: InteractiveRole;
  wallet: WalletController;
}) {
  const buyer = role === "BUYER";
  return (
    <main className="role-workspace">
      <section className="workspace-intro">
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
                "Refresh finalized dossier",
              ]
          ).map((stage, index) => (
            <li key={stage}>
              <span>{index + 1}</span>
              {stage}
            </li>
          ))}
        </ol>
        <p className="workspace-notice">
          The staged write form is enabled in the next verified slice. This
          panel does not submit partial or mock transactions.
        </p>
      </section>
    </main>
  );
}
