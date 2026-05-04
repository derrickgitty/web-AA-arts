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
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS galleries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      parent_id INTEGER REFERENCES galleries(id) ON DELETE CASCADE,
      share_token TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS artworks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '',
      file_url TEXT NOT NULL,
      thumb_url TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_galleries_user ON galleries(user_id);
    CREATE INDEX IF NOT EXISTS idx_galleries_parent ON galleries(parent_id);
    CREATE INDEX IF NOT EXISTS idx_artworks_gallery ON artworks(gallery_id);
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
  display_name: string;
  password_hash: string;
};

export type GalleryRow = {
  id: number;
  user_id: number;
  name: string;
  parent_id: number | null;
  share_token: string;
  created_at: number;
};

export type ArtworkRow = {
  id: number;
  gallery_id: number;
  title: string;
  file_url: string;
  thumb_url: string;
  created_at: number;
};
