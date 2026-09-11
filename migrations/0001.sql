CREATE TABLE IF NOT EXISTS entries (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL, locale TEXT NOT NULL CHECK(locale IN ('tw','en','jp')),
 slug TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
 visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','public')),
 meta TEXT NOT NULL DEFAULT '{}', source TEXT NOT NULL DEFAULT 'studio', version INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL, UNIQUE(kind,locale,slug)
);
CREATE INDEX IF NOT EXISTS entries_public ON entries(kind,locale,updated_at) WHERE visibility='public';
CREATE TABLE IF NOT EXISTS auth_flows (state_hash TEXT PRIMARY KEY, nonce TEXT NOT NULL, cookie_hash TEXT NOT NULL, locale TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, subject TEXT NOT NULL, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS sync_state (name TEXT PRIMARY KEY, value TEXT NOT NULL);
