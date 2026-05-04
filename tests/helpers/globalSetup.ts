import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import path from "path";

const PORT = process.env.TEST_PORT || "3010";
const DB_PATH = path.resolve(process.cwd(), "data.test.db");

let proc: ChildProcessWithoutNullStreams | null = null;

async function waitForReady(url: string, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function resetDb() {
  for (const ext of ["", "-wal", "-shm", "-journal"]) {
    const p = DB_PATH + ext;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

function resetUploads() {
  const dir = path.resolve(process.cwd(), "public", "uploads");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (f === ".gitkeep") continue;
    if (f.startsWith("test_")) fs.unlinkSync(path.join(dir, f));
  }
}

export async function setup() {
  resetDb();
  resetUploads();

  // Run the seed against the test DB so we have known accounts (admin, alva, alsa).
  await new Promise<void>((resolve, reject) => {
    const seed = spawn("npx", ["tsx", "scripts/seed.ts"], {
      env: { ...process.env, DATA_DB_PATH: DB_PATH },
      stdio: "pipe",
    });
    let out = "";
    seed.stdout.on("data", (b) => (out += b.toString()));
    seed.stderr.on("data", (b) => (out += b.toString()));
    seed.on("exit", (code) => {
      if (code === 0) {
        // Capture passwords for tests to read
        fs.writeFileSync(path.resolve(process.cwd(), "tests/.seed-output.txt"), out);
        resolve();
      } else {
        reject(new Error(`seed failed: ${out}`));
      }
    });
  });

  // Spawn Next dev server pointing at the test DB, on a non-standard port.
  proc = spawn("npx", ["next", "dev", "-p", PORT], {
    env: { ...process.env, DATA_DB_PATH: DB_PATH, PORT },
    stdio: "pipe",
  });
  // Pipe to stderr only on errors so vitest output stays clean
  proc.stdout.on("data", () => {});
  proc.stderr.on("data", (b) => {
    const s = b.toString();
    if (/error/i.test(s)) process.stderr.write("[next] " + s);
  });

  await waitForReady(`http://localhost:${PORT}/login`);
}

export async function teardown() {
  if (proc) {
    proc.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
    if (!proc.killed) proc.kill("SIGKILL");
  }
}
