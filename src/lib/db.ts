import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data.db");

declare global {
  // eslint-disable-next-line no-var
  var _db: Database.Database | undefined;
}

function init(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'kid',
      avatar_url TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      storage_bytes INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS galleries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      parent_id INTEGER REFERENCES galleries(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS artworks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'image',     -- 'image' | 'pdf'
      file_url TEXT NOT NULL,
      thumb_url TEXT NOT NULL,
      bytes INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
      created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_label TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at INTEGER,                     -- NULL = permanent
      revoked_at INTEGER,                     -- NULL = active
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS share_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      share_id INTEGER NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
      viewed_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      viewer_ip TEXT,
      viewer_user_agent TEXT
    );
    CREATE TABLE IF NOT EXISTS login_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      username_attempted TEXT NOT NULL,
      success INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS admin_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL,              -- 'reset_password' | 'revoke_share' | 'create_user' etc.
      target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      target_share_id INTEGER REFERENCES shares(id) ON DELETE SET NULL,
      details TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_galleries_user ON galleries(user_id);
    CREATE INDEX IF NOT EXISTS idx_galleries_parent ON galleries(parent_id);
    CREATE INDEX IF NOT EXISTS idx_artworks_gallery ON artworks(gallery_id);
    CREATE INDEX IF NOT EXISTS idx_shares_gallery ON shares(gallery_id);
    CREATE INDEX IF NOT EXISTS idx_share_views_share ON share_views(share_id);
    CREATE INDEX IF NOT EXISTS idx_login_events_username ON login_events(username_attempted, created_at);
  `);
}

export function getDb() {
  if (!global._db) {
    const db = new Database(dbPath);
    init(db);
    global._db = db;
  }
  return global._db;
}

export type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: "kid" | "admin";
  avatar_url: string | null;
  must_change_password: number;
  storage_bytes: number;
  created_at: number;
};

export type GalleryRow = {
  id: number;
  user_id: number;
  name: string;
  parent_id: number | null;
  created_at: number;
};

export type ArtworkRow = {
  id: number;
  gallery_id: number;
  title: string;
  kind: "image" | "pdf";
  file_url: string;
  thumb_url: string;
  bytes: number;
  created_at: number;
};

export type ShareRow = {
  id: number;
  gallery_id: number;
  created_by_user_id: number;
  recipient_label: string;
  token: string;
  expires_at: number | null;
  revoked_at: number | null;
  created_at: number;
};

export const STORAGE_QUOTA_BYTES = 500 * 1024 * 1024; // 500MB per kid
