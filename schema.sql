CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  saturday_afternoon INTEGER NOT NULL DEFAULT 0,
  saturday_night INTEGER NOT NULL DEFAULT 0,
  sunday_afternoon INTEGER NOT NULL DEFAULT 0,
  device_fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_email ON votes(email);
CREATE INDEX IF NOT EXISTS idx_votes_device_fingerprint ON votes(device_fingerprint);
