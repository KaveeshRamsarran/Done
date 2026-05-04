import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";

const checks = [];

async function main() {
  const appUrl = process.argv[2] || "http://127.0.0.1:4173/";
  const browserPath = process.env.BROWSER_PATH || findBrowser();

  if (!browserPath) {
    throw new Error("No Chromium-based browser found. Set BROWSER_PATH to run the livecheck.");
  }

  const userDataDir = await mkdtemp(join(tmpdir(), "done-livecheck-"));
  const debugPort = await getFreePort();
  const browser = spawn(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-background-networking",
    "--no-default-browser-check",
    "--no-first-run",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    appUrl,
  ], { stdio: "ignore" });

  try {
    const target = await waitForPageTarget(debugPort, appUrl);
    const cdp = await CdpClient.connect(target.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: appUrl });

    await waitForExpression(cdp, "document.readyState === 'complete'");
    await sleep(200);
  await check(cdp, "main screen renders Study Session", `
    document.querySelector("[data-screen='main']") &&
    document.querySelector(".ios-status") &&
    document.querySelector(".timer-title")?.textContent.trim() === "Study Session" &&
    document.querySelector(".primary-action")?.textContent.trim() === "Start"
  `);

  await check(cdp, "iPhone-inspired shell is visible", `
    (() => {
      const shell = document.querySelector(".app-shell");
      const island = getComputedStyle(shell, "::before");
      const home = getComputedStyle(shell, "::after");
      const box = shell.getBoundingClientRect();
      return box.width >= 360 && island.content !== "none" && home.content !== "none";
    })()
  `);

  await check(cdp, "realistic hourglass is visible and centered", `
    (() => {
      const svg = document.querySelector(".hourglass svg");
      if (!svg) return false;
      const box = svg.getBoundingClientRect();
      return box.width > 190 &&
        box.height > 280 &&
        document.querySelector(".glass-caustic") &&
        document.querySelector("[data-bottom-mound]") &&
        document.querySelector(".wood-grain");
    })()
  `);

  await evaluate(cdp, `document.querySelector(".primary-action").click(); true`);
  await waitForExpression(cdp, `document.querySelector(".primary-action")?.textContent.trim() === "Pause"`);
  await sleep(1250);
  await check(cdp, "start button runs smooth sand flow", `
    document.querySelector(".sand-stream")?.classList.contains("is-flowing") &&
    document.querySelector(".hourglass")?.classList.contains("is-running") &&
    /24:5[89]/.test(document.querySelector(".time-remaining")?.textContent || "")
  `);

  await evaluate(cdp, `document.querySelector(".primary-action").click(); true`);
  await waitForExpression(cdp, `document.querySelector(".primary-action")?.textContent.trim() === "Resume"`);
  await check(cdp, "pause state is reachable", `
    !document.querySelector(".sand-stream")?.classList.contains("is-flowing")
  `);

  await evaluate(cdp, `document.querySelector(".primary-action").click(); true`);
  await waitForExpression(cdp, `document.querySelector(".primary-action")?.textContent.trim() === "Pause"`);
  await check(cdp, "resume state restarts the timer", `
    document.querySelector(".sand-stream")?.classList.contains("is-flowing")
  `);

  await evaluate(cdp, `document.querySelector("[data-action='new']").click(); true`);
  await waitForExpression(cdp, `document.querySelector("[data-screen='create']")`);
  await check(cdp, "create timer screen renders", `
    document.querySelector(".create-heading h1")?.textContent.trim() === "New Timer" &&
    document.querySelector("input[name='title']") &&
    document.querySelector("input[name='minutes']")
  `);

  await evaluate(cdp, `
    const title = document.querySelector("input[name='title']");
    const range = document.querySelector("input[name='minutes']");
    title.value = "Quick Timer";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    range.value = "1";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector(".create-form").requestSubmit();
    true;
  `);
  await waitForExpression(cdp, `document.querySelector(".timer-title")?.textContent.trim() === "Quick Timer"`);
  await check(cdp, "new timer starts immediately", `
    document.querySelector(".primary-action")?.textContent.trim() === "Pause"
  `);

  await sleep(1300);
  await evaluate(cdp, `document.querySelector("[data-action='menu']").click(); true`);
  await waitForExpression(cdp, `document.querySelector(".sidebar")?.classList.contains("is-open")`);
  await check(cdp, "sidebar lists and highlights active timers", `
    (() => {
      const items = [...document.querySelectorAll(".timer-list-item")];
      const quick = items.find((item) => item.querySelector(".timer-list-title")?.textContent.trim() === "Quick Timer");
      return items.length >= 2 && quick?.classList.contains("is-selected");
    })()
  `);

  const quickBefore = parseTimerText(await evaluate(cdp, `
    [...document.querySelectorAll(".timer-list-item")]
      .find((item) => item.querySelector(".timer-list-title")?.textContent.trim() === "Quick Timer")
      ?.querySelector(".timer-list-time")?.textContent.trim()
  `));

  await evaluate(cdp, `
    [...document.querySelectorAll(".timer-list-item")]
      .find((item) => item.querySelector(".timer-list-title")?.textContent.trim() === "Study Session")
      .click();
    true;
  `);
  await waitForExpression(cdp, `document.querySelector(".timer-title")?.textContent.trim() === "Study Session"`);
  await sleep(1500);
  await evaluate(cdp, `document.querySelector("[data-action='menu']").click(); true`);
  await waitForExpression(cdp, `document.querySelector(".sidebar")?.classList.contains("is-open")`);

  const quickAfter = parseTimerText(await evaluate(cdp, `
    [...document.querySelectorAll(".timer-list-item")]
      .find((item) => item.querySelector(".timer-list-title")?.textContent.trim() === "Quick Timer")
      ?.querySelector(".timer-list-time")?.textContent.trim()
  `));

  if (!(Number.isFinite(quickBefore) && Number.isFinite(quickAfter) && quickAfter < quickBefore)) {
    throw new Error(`Background timer did not tick down while unselected: before=${quickBefore}, after=${quickAfter}`);
  }
  checks.push("background timer keeps running while unselected");

  await evaluate(cdp, `
    [...document.querySelectorAll(".timer-list-item")]
      .find((item) => item.querySelector(".timer-list-title")?.textContent.trim() === "Quick Timer")
      .click();
    true;
  `);
  await waitForExpression(cdp, `document.querySelector(".timer-title")?.textContent.trim() === "Quick Timer"`);

  await evaluate(cdp, `
    const realNow = Date.now.bind(Date);
    Date.now = () => realNow() + 5 * 60 * 1000;
    true;
  `);
  await waitForExpression(cdp, `document.querySelector(".finish-message")?.classList.contains("is-visible")`, 5000);
  await check(cdp, "finish state shows Time's up", `
    document.querySelector(".finish-message")?.textContent.trim() === "Time's up" &&
    document.querySelector(".hourglass")?.classList.contains("is-finished") &&
    document.querySelector(".time-remaining")?.textContent.trim() === "0:00 remaining"
  `);
  await check(cdp, "sand fully settles at completion", `
    Number(document.querySelector("[data-top-sand]")?.getAttribute("height")) <= 0.5 &&
    Number(document.querySelector("[data-bottom-sand]")?.getAttribute("height")) >= 81
  `);

    await cdp.close();
    console.log("Livecheck passed");
    for (const item of checks) {
      console.log(`- ${item}`);
    }
  } finally {
    browser.kill();
    await waitForExit(browser);
    await removeWithRetry(userDataDir);
  }
}

function findBrowser() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForPageTarget(port, expectedUrl) {
  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const target = targets.find((item) => item.type === "page" && item.url.startsWith(expectedUrl));
      if (target?.webSocketDebuggerUrl) {
        return target;
      }
    } catch {
      await sleep(120);
    }

    await sleep(120);
  }

  throw new Error("Timed out waiting for browser target");
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result || {});
        }
        return;
      }

      const listeners = this.events.get(message.method) || [];
      for (const listener of listeners) {
        listener(message.params || {});
      }
    });
  }

  static connect(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.addEventListener("open", () => resolve(new CdpClient(socket)), { once: true });
      socket.addEventListener("error", () => reject(new Error("Could not connect to browser websocket")), { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(cdp, expression) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });

  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || "Runtime evaluation failed");
  }

  return response.result?.value;
}

async function waitForExpression(cdp, expression, timeout = 3000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await evaluate(cdp, `Boolean(${expression})`)) {
      return;
    }
    await sleep(80);
  }

  throw new Error(`Timed out waiting for expression: ${expression}`);
}

async function check(cdp, label, expression) {
  if (!await evaluate(cdp, `Boolean(${expression})`)) {
    const diagnostic = await evaluate(cdp, `
      JSON.stringify({
        title: document.title,
        bodyText: document.body?.innerText,
        bodyHtml: document.body?.innerHTML?.slice(0, 700),
        url: location.href
      }, null, 2)
    `);
    throw new Error(`Check failed: ${label}\n${diagnostic}`);
  }

  checks.push(label);
}

function parseTimerText(value) {
  const text = String(value || "");
  const time = text.match(/^(\d+):(\d{2})$/);
  if (time) {
    return Number(time[1]) * 60 + Number(time[2]);
  }

  const hours = text.match(/^(\d+)h\s+(\d+)m$/);
  if (hours) {
    return Number(hours[1]) * 3600 + Number(hours[2]) * 60;
  }

  return Number.NaN;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForExit(process) {
  if (process.exitCode !== null || process.killed) {
    return sleep(500);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 1500);
    process.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function removeWithRetry(path) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 5) {
        console.warn(`Warning: could not remove temporary browser profile: ${error.message}`);
        return;
      }
      await sleep(250);
    }
  }
}

await main();
