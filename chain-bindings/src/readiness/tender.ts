import type { Address } from "viem";
import type { PublicTender } from "../domain/tender.js";

export interface TenderReadiness {
  needsFundingProof: boolean;
  canClose: boolean;
  needsWinnerProof: boolean;
  canBuyerCancel: boolean;
  terminal: boolean;
}

export function getTenderReadiness(
  tender: PublicTender,
  timestamp: bigint,
  actor?: Address,
): TenderReadiness {
  const buyerActor =
    actor !== undefined &&
    actor.toLowerCase() === tender.buyer.toLowerCase();
  return {
    needsFundingProof: tender.status === "FundingPending",
    canClose:
      tender.status === "Open" && timestamp >= tender.bidDeadline,
    needsWinnerProof: tender.status === "Closed",
    canBuyerCancel:
      tender.status === "Open" &&
      tender.bidCount === 0 &&
      buyerActor,
    terminal: ["Awarded", "Refunded", "Cancelled"].includes(
      tender.status,
    ),
  };
}
