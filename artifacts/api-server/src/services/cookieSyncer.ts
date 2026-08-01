import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { db, toolsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { decrypt } from "../lib/encrypt.js";
import { logger } from "../lib/logger.js";
import { execSync } from "child_process";

puppeteerExtra.use(StealthPlugin());

/** Resolve the system Chromium executable at runtime */
function getChromiumPath(): string {
  try {
    return execSync("which chromium", { encoding: "utf8" }).trim();
  } catch {
    // Fallback to common nix store path pattern
    try {
      return execSync("find /nix/store -name 'chromium' -type f 2>/dev/null | head -1", {
        encoding: "utf8",
      }).trim();
    } catch {
      return "/usr/bin/chromium";
    }
  }
}

export type SyncResult = {
  success: boolean;
  message: string;
  cookieCount?: number;
};

/**
 * Launch a headless Chromium, log in to the tool's portal,
 * capture the resulting session cookies, and persist them to the DB.
 */
export async function syncToolCookies(toolId: number): Promise<SyncResult> {
  const [tool] = await db
    .select()
    .from(toolsTable)
    .where(eq(toolsTable.id, toolId));

  if (!tool) {
    return { success: false, message: "Tool not found" };
  }

  if (!tool.botLoginUrl || !tool.botUsername || !tool.botPassword) {
    return {
      success: false,
      message: "Bot credentials not configured for this tool",
    };
  }

  let password: string;
  try {
    password = decrypt(tool.botPassword);
  } catch {
    return { success: false, message: "Failed to decrypt bot password" };
  }

  const executablePath = getChromiumPath();
  logger.info({ toolId, executablePath }, "Starting cookie sync");

  const browser = await puppeteerExtra.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the login page
    await page.goto(tool.botLoginUrl, {
      waitUntil: "networkidle2",
      timeout: 30_000,
    });

    // Generic login strategy: find username/email field, password field, submit
    await page.evaluate(
      async (username: string, password: string) => {
        const inputs = Array.from(document.querySelectorAll("input"));

        const usernameInput = inputs.find(
          (el) =>
            el.type === "email" ||
            el.type === "text" ||
            /user|email|login/i.test(el.name + el.id + el.placeholder),
        );
        const passwordInput = inputs.find(
          (el) =>
            el.type === "password" ||
            /pass/i.test(el.name + el.id + el.placeholder),
        );

        if (usernameInput) {
          usernameInput.focus();
          usernameInput.value = username;
          usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
          usernameInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (passwordInput) {
          passwordInput.focus();
          passwordInput.value = password;
          passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
          passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
        }

        const submitBtn = document.querySelector<HTMLElement>(
          "button[type='submit'], input[type='submit']",
        );
        if (submitBtn) submitBtn.click();
      },
      tool.botUsername,
      password,
    );

    // Wait for navigation after form submit
    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 20_000,
    }).catch(() => {
      // Some SPAs don't trigger full navigation — continue anyway
    });

    const cookies = await page.cookies();
    const cookieJson = JSON.stringify(
      cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite,
      })),
    );

    await db
      .update(toolsTable)
      .set({ cookieData: cookieJson, lastCookieSync: new Date() })
      .where(eq(toolsTable.id, toolId));

    logger.info({ toolId, cookieCount: cookies.length }, "Cookie sync complete");
    return {
      success: true,
      message: `Synced ${cookies.length} cookies`,
      cookieCount: cookies.length,
    };
  } catch (err: any) {
    const msg = err?.message ?? "Unknown error";
    logger.error({ toolId, err: msg }, "Cookie sync failed");

    if (/captcha/i.test(msg)) {
      return { success: false, message: "CAPTCHA detected — manual login required" };
    }
    if (/timeout/i.test(msg)) {
      return { success: false, message: "Timed out waiting for login page" };
    }
    return { success: false, message: msg };
  } finally {
    await browser.close();
  }
}
