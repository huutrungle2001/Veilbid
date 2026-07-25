import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("../../contracts/market/VeilBidMarket.sol", import.meta.url),
  "utf8",
);
const artifact = JSON.parse(
  readFileSync(
    new URL(
      "../../artifacts/contracts/market/VeilBidMarket.sol/VeilBidMarket.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const functions = artifact.abi.filter(({ type }) => type === "function");

function abiFunction(name) {
  return functions.find((entry) => entry.name === name);
}

describe("VeilBidMarket production surface", () => {
  it("accepts no plaintext winner or winner address during finalization", () => {
    const finalize = abiFunction("finalizeTender");
    assert.ok(finalize);
    assert.deepEqual(
      finalize.inputs.map(({ type }) => type),
      ["uint256", "bytes"],
    );
    assert.match(
      source,
      /Nox\.publicDecrypt\(\s*tender\.encryptedWinnerBidId,/,
    );
    assert.match(source, /winningBid\.vendor/);
  });

  it("keeps bid prices encrypted and never publishes best price", () => {
    assert.match(source, /euint256 encryptedPrice;/);
    assert.match(source, /euint256 encryptedBestPrice;/);
    assert.doesNotMatch(source, /mapping\([^;]*plaintext/i);
    assert.doesNotMatch(
      source,
      /allowPublicDecryption\(tender\.encryptedBestPrice\)/,
    );
    assert.equal(
      [...source.matchAll(/Nox\.allowPublicDecryption\(/g)].length,
      2,
      "only the funding equality and winner ID may be public",
    );
  });

  it("exposes no administrator, arbitrary withdrawal, or Safe execution path", () => {
    const forbidden = new Set([
      "admin",
      "execute",
      "executeTransaction",
      "execTransactionFromModule",
      "owner",
      "setWinner",
      "withdraw",
    ]);
    assert.deepEqual(
      functions.filter(({ name }) => forbidden.has(name)).map(({ name }) => name),
      [],
    );
  });

  it("fits the EIP-170 runtime bytecode limit", () => {
    const deployedBytes = (artifact.deployedBytecode.length - 2) / 2;
    assert.ok(
      deployedBytes <= 24_576,
      `runtime bytecode is ${deployedBytes} bytes`,
    );
  });
});
