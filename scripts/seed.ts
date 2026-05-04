import bcrypt from "bcryptjs";
import { getDb, UserRow } from "../src/lib/db";
import { generateFriendlyPassword } from "../src/lib/passwords";

type Spec = { username: string; display_name: string; role: "kid" | "admin"; createGallery: boolean };

const ACCOUNTS: Spec[] = [
  { username: "admin", display_name: "Admin", role: "admin", createGallery: false },
  { username: "alva", display_name: "Alva", role: "kid", createGallery: true },
  { username: "alsa", display_name: "Alsa", role: "kid", createGallery: true },
];

function seed() {
  const db = getDb();
  const credentials: { username: string; password: string; role: string }[] = [];

  for (const a of ACCOUNTS) {
    const existing = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(a.username) as Pick<UserRow, "id"> | undefined;
    if (existing) {
      console.log(`✓ ${a.display_name} already exists (id=${existing.id}) — skipping`);
      continue;
    }
    const password = generateFriendlyPassword();
    const hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (username, password_hash, display_name, role, must_change_password) VALUES (?, ?, ?, ?, 1)"
      )
      .run(a.username, hash, a.display_name, a.role);
    const userId = Number(result.lastInsertRowid);

    if (a.createGallery) {
      db.prepare("INSERT INTO galleries (user_id, name, parent_id) VALUES (?, ?, NULL)").run(
        userId,
        `${a.display_name}'s Art`
      );
    }

    credentials.push({ username: a.username, password, role: a.role });
    console.log(`✨ Created ${a.display_name} (id=${userId}, role=${a.role})`);
  }

  if (credentials.length === 0) {
    console.log("\nNothing to do. To reset, delete data.db and re-run.");
    return;
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  PASSWORDS — copy these somewhere safe!");
  console.log("  Each user MUST change theirs on first login.");
  console.log("═══════════════════════════════════════════════");
  for (const c of credentials) {
    console.log(`  ${c.username.padEnd(8)} (${c.role.padEnd(5)})  →  ${c.password}`);
  }
  console.log("═══════════════════════════════════════════════\n");
}

seed();
