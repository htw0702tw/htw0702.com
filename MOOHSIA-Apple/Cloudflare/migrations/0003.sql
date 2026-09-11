CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_kind ON activity(kind);

CREATE TABLE IF NOT EXISTS watchlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '情報',
  enabled INTEGER NOT NULL DEFAULT 1,
  interval_minutes INTEGER NOT NULL DEFAULT 180,
  last_run_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_watchlists_enabled_last_run ON watchlists(enabled, last_run_at);

CREATE TABLE IF NOT EXISTS integration_state (
  name TEXT PRIMARY KEY,
  last_sync_at TEXT,
  last_error TEXT,
  item_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS search_usage (
  month_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO watchlists(id,name,query,category,enabled,interval_minutes,last_run_at,created_at) VALUES('bcbdd0c4-eec1-4d8d-8ae7-bcd781f48001','全球即時情報','latest breaking news OpenAI Apple Microsoft Amazon SpaceX Tesla NASA AI technology economy geopolitics disaster','全球',1,180,NULL,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO watchlists(id,name,query,category,enabled,interval_minutes,last_run_at,created_at) VALUES('bcbdd0c4-eec1-4d8d-8ae7-bcd781f48002','台灣即時情報','台灣 即時 新聞 交通事故 管制 天氣 地震 活動 政治 政策 軍事','台灣',1,180,NULL,CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO watchlists(id,name,query,category,enabled,interval_minutes,last_run_at,created_at) VALUES('bcbdd0c4-eec1-4d8d-8ae7-bcd781f48003','全球資安情報','cybersecurity CVE zero-day CISA KEV Microsoft Windows Office Excel Outlook Teams Apple iOS macOS Google Chrome Android breach ransomware outage','資安',1,180,NULL,CURRENT_TIMESTAMP);
