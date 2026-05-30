import fs from "node:fs/promises";
import { spawn } from "node:child_process";

const secretName = process.env.COZE_SECRET_NAME || "COZE_COOKIES_JSON";
const statePath = process.env.UPDATED_STORAGE_STATE_PATH || "artifacts/storage_state.updated.json";
const token = process.env.GH_PAT || "";
const repository = process.env.GITHUB_REPOSITORY || "";

async function main() {
  if (!token) {
    console.log("GH_PAT is not set; skipping GitHub secret update.");
    return;
  }
  if (!repository) {
    throw new Error("GITHUB_REPOSITORY is missing.");
  }

  const value = await fs.readFile(statePath, "utf8");
  const storageState = JSON.parse(value);
  const cookies = filterCookies(Array.isArray(storageState.cookies) ? storageState.cookies : []);
  if (cookies.length === 0) {
    throw new Error("No usable cookies were found in the updated storage state.");
  }

  await setSecretWithGh(secretName, JSON.stringify(cookies), repository, token);
  console.log(`Updated repository secret ${secretName}.`);
}

function filterCookies(cookies) {
  return cookies.filter((cookie) => {
    const domain = String(cookie.domain || "");
    return /coze\.cn|volcengine\.com|volccloudidentity\.com/.test(domain);
  }).map((cookie) => ({
    name: String(cookie.name || ""),
    value: String(cookie.value || ""),
    domain: cookie.domain,
    path: cookie.path || "/",
    httpOnly: Boolean(cookie.httpOnly),
    secure: cookie.secure !== false,
    sameSite: cookie.sameSite || "Lax",
    ...(typeof cookie.expires === "number" ? { expires: cookie.expires } : {})
  }));
}

async function setSecretWithGh(name, value, repository, token) {
  const ghPath = process.env.GH_CLI_PATH || "gh";
  const child = spawn(ghPath, ["secret", "set", name, "--repo", repository], {
    env: {
      ...process.env,
      GH_TOKEN: token
    },
    stdio: ["pipe", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  child.stdin.end(value);

  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });

  if (code !== 0) {
    throw new Error(`gh secret set failed with exit code ${code}: ${stderr || stdout}`);
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
