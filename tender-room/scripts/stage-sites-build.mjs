import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const tenderRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workspaceRoot = resolve(tenderRoot, "..");
const target = resolve(workspaceRoot, "dist");
const workerOutput = resolve(target, "veilbid_tender_room");
const serverOutput = resolve(target, "server");

await mkdir(serverOutput, { recursive: true });
await cp(workerOutput, serverOutput, { recursive: true });
await mkdir(resolve(target, ".openai"), { recursive: true });
await cp(
  resolve(workspaceRoot, ".openai", "hosting.json"),
  resolve(target, ".openai", "hosting.json"),
);
