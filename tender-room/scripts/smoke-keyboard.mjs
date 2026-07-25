import { execFileSync, spawn } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const baseUrl = new URL(
  process.argv[2] ??
    process.env.VEILBID_PRODUCTION_URL ??
    "https://veilbid-three.vercel.app",
);
const evidencePath = resolve(
  root,
  process.env.VEILBID_KEYBOARD_EVIDENCE ??
    "evidence/sepolia/production-keyboard.json",
);
const deploymentEvidence = JSON.parse(
  readFileSync(
    resolve(root, "evidence/sepolia/production-smoke.json"),
    "utf8",
  ),
);

if (
  baseUrl.protocol !== "https:" &&
  !["127.0.0.1", "localhost"].includes(baseUrl.hostname)
) {
  throw new Error("Keyboard smoke requires HTTPS or a local test URL");
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const chrome = candidates.find((candidate) => existsSync(candidate));
  if (!chrome) {
    throw new Error("Set CHROME_BIN to run production keyboard smoke");
  }
  return chrome;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDevTools(profile, chromeProcess, stderr) {
  const portFile = join(profile, "DevToolsActivePort");
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (existsSync(portFile)) {
      const [port] = readFileSync(portFile, "utf8").trim().split("\n");
      if (port) return Number(port);
    }
    if (chromeProcess.exitCode !== null) {
      throw new Error(
        `Chrome exited before DevTools became ready: ${stderr.value.slice(-500)}`,
      );
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for Chrome DevTools");
}

async function findPage(port) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(
      (response) => response.json(),
    );
    const page = pages.find(
      (entry) =>
        entry.type === "page" &&
        new URL(entry.url).origin === baseUrl.origin,
    );
    if (page) return page;
    await delay(100);
  }
  throw new Error("Timed out waiting for the VeilBid browser page");
}

class CdpSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);
      if (response.error) pending.reject(new Error(response.error.message));
      else pending.resolve(response.result);
    };
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    return new CdpSession(socket);
  }

  request(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.request("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text);
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

async function waitFor(cdp, expression, label) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await cdp.evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const keys = {
  Enter: { code: "Enter", keyCode: 13 },
  Tab: { code: "Tab", keyCode: 9 },
};

async function pressKey(cdp, key, modifiers = 0) {
  const definition = keys[key];
  await cdp.request("Input.dispatchKeyEvent", {
    code: definition.code,
    key,
    modifiers,
    nativeVirtualKeyCode: definition.keyCode,
    type: "rawKeyDown",
    windowsVirtualKeyCode: definition.keyCode,
  });
  await cdp.request("Input.dispatchKeyEvent", {
    code: definition.code,
    key,
    modifiers,
    nativeVirtualKeyCode: definition.keyCode,
    type: "keyUp",
    windowsVirtualKeyCode: definition.keyCode,
  });
  await delay(100);
}

async function activeElement(cdp) {
  return cdp.evaluate(`(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      label: element.textContent.trim().replace(/\\s+/g, " "),
      tag: element.tagName,
      ariaCurrent: element.getAttribute("aria-current"),
      focusIndicatorVisible:
        (style.outlineStyle !== "none" &&
          Number.parseFloat(style.outlineWidth) >= 2) ||
        style.boxShadow !== "none",
      visible:
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < innerHeight &&
        rect.left < innerWidth,
    };
  })()`);
}

const chrome = findChrome();
const profile = mkdtempSync(join(tmpdir(), "veilbid-keyboard-"));
const stderr = { value: "" };
const chromeProcess = spawn(
  chrome,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-gpu",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--window-size=1280,900",
    baseUrl.toString(),
  ],
  {
    cwd: root,
    stdio: ["ignore", "ignore", "pipe"],
  },
);
chromeProcess.stderr.setEncoding("utf8");
chromeProcess.stderr.on("data", (chunk) => {
  stderr.value = `${stderr.value}${chunk}`.slice(-4_000);
});

let cdp;
try {
  const port = await waitForDevTools(profile, chromeProcess, stderr);
  const page = await findPage(port);
  cdp = await CdpSession.connect(page.webSocketDebuggerUrl);
  await cdp.request("Page.enable");
  await cdp.request("Runtime.enable");
  await waitFor(
    cdp,
    `document.readyState === "complete" &&
      Boolean(document.querySelector('[aria-label="Primary navigation"]'))`,
    "the shared navigation",
  );
  await cdp.evaluate(`(() => {
    document.querySelector(".topbar").dataset.keyboardSmoke = "persistent";
    window.focus();
    document.activeElement?.blur();
    return true;
  })()`);

  const forwardFocus = [];
  for (let index = 0; index < 5; index += 1) {
    await pressKey(cdp, "Tab");
    forwardFocus.push(await activeElement(cdp));
  }

  await pressKey(cdp, "Enter");
  await waitFor(
    cdp,
    `location.pathname === "/docs" &&
      document.querySelector('[aria-current="page"]')?.textContent.trim() ===
        "EVIDENCE"`,
    "the Evidence route",
  );
  await waitFor(
    cdp,
    `(() => {
      const headerRect = document.querySelector(".topbar").getBoundingClientRect();
      const targetRect = document.getElementById("evidence").getBoundingClientRect();
      return targetRect.top >= headerRect.bottom && targetRect.top < innerHeight;
    })()`,
    "the Evidence section below the sticky header",
  );
  const evidenceRoute = await cdp.evaluate(`(() => {
    const header = document.querySelector(".topbar");
    const target = document.getElementById("evidence");
    const headerRect = header.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    return {
      activeLabel:
        document.querySelector('[aria-current="page"]')?.textContent.trim(),
      hash: location.hash,
      headerPersistent: header.dataset.keyboardSmoke === "persistent",
      targetVisibleBelowHeader:
        targetRect.top >= headerRect.bottom && targetRect.top < innerHeight,
    };
  })()`);

  await pressKey(cdp, "Tab", 8);
  const reverseFocus = await activeElement(cdp);
  await pressKey(cdp, "Enter");
  await waitFor(
    cdp,
    `location.pathname === "/docs" &&
      location.hash === "" &&
      document.querySelector('[aria-current="page"]')?.textContent.trim() ===
        "DOCS"`,
    "the Docs route",
  );
  const docsRoute = await cdp.evaluate(`(() => ({
    activeLabel:
      document.querySelector('[aria-current="page"]')?.textContent.trim(),
    headerPersistent:
      document.querySelector(".topbar").dataset.keyboardSmoke === "persistent",
  }))()`);

  const expectedFocusOrder = [
    "SKIP TO CONTENT",
    "VEILBID",
    "TENDERS",
    "DOCS",
    "EVIDENCE",
  ];
  const observedFocusOrder = forwardFocus.map((entry) => entry.label);
  const assertions = {
    primaryNavigationKeyboardReachable:
      JSON.stringify(observedFocusOrder) ===
      JSON.stringify(expectedFocusOrder),
    everyFocusTargetVisible: forwardFocus.every((entry) => entry.visible),
    everyFocusIndicatorVisible: forwardFocus.every(
      (entry) => entry.focusIndicatorVisible,
    ),
    skipLinkVisibleOnFocus: forwardFocus[0]?.visible === true,
    evidenceActivatedByKeyboard:
      evidenceRoute.activeLabel === "EVIDENCE" &&
      evidenceRoute.hash === "#evidence",
    evidenceTargetVisibleBelowStickyHeader:
      evidenceRoute.targetVisibleBelowHeader,
    reverseTraversalReturnedToDocs: reverseFocus.label === "DOCS",
    docsActivatedByKeyboard: docsRoute.activeLabel === "DOCS",
    headerPersistedAcrossRoutes:
      evidenceRoute.headerPersistent && docsRoute.headerPersistent,
  };
  const blockers = Object.entries(assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  const evidence = {
    schemaVersion: 1,
    suite: "production-keyboard-navigation",
    recordedAt: new Date().toISOString(),
    publicIdentifiers: {
      testCommit: git("rev-parse", "HEAD"),
      deploymentSourceCommit:
        deploymentEvidence.publicIdentifiers.sourceCommit,
      deploymentId: deploymentEvidence.publicIdentifiers.deploymentId,
      canonicalUrl: baseUrl.origin,
      browser: execFileSync(chrome, ["--version"], {
        encoding: "utf8",
      }).trim(),
      viewport: "1280x900",
    },
    observations: {
      expectedFocusOrder,
      observedFocusOrder,
      activeRouteSequence: [
        evidenceRoute.activeLabel,
        docsRoute.activeLabel,
      ],
    },
    assertions,
    blockers,
    notes: [
      "A real headless Chrome session used only Tab, Shift+Tab, and Enter to traverse and activate the production navigation.",
      "The smoke records public labels and route assertions only; it does not connect a wallet or access confidential state.",
    ],
  };
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, {
    mode: 0o600,
  });
  console.log(JSON.stringify(evidence, null, 2));
  if (blockers.length > 0) process.exitCode = 1;
} finally {
  cdp?.close();
  chromeProcess.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => chromeProcess.once("exit", resolve)),
    delay(2_000),
  ]);
  if (chromeProcess.exitCode === null) chromeProcess.kill("SIGKILL");
  rmSync(profile, { force: true, recursive: true });
}
