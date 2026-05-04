import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { getDb, UserRow } from "../src/lib/db";

// Friendly password generator: two cute words + 3 digits → e.g. "kitty-rose-471"
const WORDS_A = ["kitty", "bunny", "panda", "puppy", "honey", "berry", "fairy", "sunny", "petal", "daisy"];
const WORDS_B = ["rose", "moon", "star", "cloud", "dream", "glow", "snow", "mint", "lila", "pearl"];
const digits = customAlphabet("0123456789", 3);
function makePassword() {
  const a = WORDS_A[Math.floor(Math.random() * WORDS_A.length)];
  const b = WORDS_B[Math.floor(Math.random() * WORDS_B.length)];
  return `${a}-${b}-${digits()}`;
}

const shareToken = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789", 32);

const KIDS = [
  { username: "alva", display_name: "Alva" },
  { username: "alsa", display_name: "Alsa" },
];

function seed() {
  const db = getDb();
  const credentials: { username: string; password: string }[] = [];

  for (const kid of KIDS) {
    const existing = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(kid.username) as Pick<UserRow, "id"> | undefined;
    if (existing) {
      console.log(`✓ ${kid.display_name} already exists (id=${existing.id}) — skipping`);
      continue;
    }
    const password = makePassword();
    const hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare("INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)")
      .run(kid.username, hash, kid.display_name);
    const userId = Number(result.lastInsertRowid);

    db.prepare(
      "INSERT INTO galleries (user_id, name, parent_id, share_token) VALUES (?, ?, NULL, ?)"
    ).run(userId, `${kid.display_name}'s Art`, shareToken());

    credentials.push({ username: kid.username, password });
    console.log(`✨ Created ${kid.display_name} (id=${userId}) with main gallery`);
  }

  if (credentials.length === 0) {
    console.log("\nNothing to do. To reset passwords, delete data.db and re-run.");
    return;
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  PASSWORDS — copy these somewhere safe!");
  console.log("  (you will not see them again)");
  console.log("═══════════════════════════════════════════");
  for (const c of credentials) {
    console.log(`  ${c.username.padEnd(8)} →  ${c.password}`);
  }
  console.log("═══════════════════════════════════════════\n");
}

seed();
