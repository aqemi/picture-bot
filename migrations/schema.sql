DROP TABLE IF EXISTS threads;

CREATE TABLE
  threads (
    chatId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL
  );

DROP INDEX IF EXISTS idx_chatId;

CREATE INDEX idx_chatId ON threads (chatId);

DROP INDEX IF EXISTS idx_createdAt;

CREATE INDEX idx_createdAt ON threads (createdAt);

DROP TRIGGER IF EXISTS delete_old_messages;

CREATE TRIGGER delete_old_messages AFTER INSERT ON threads BEGIN
DELETE FROM threads
WHERE
  createdAt < datetime ('now', '-3 days');

END;

-- DROP TABLE IF EXISTS prompts;

CREATE TABLE IF NOT EXISTS
  prompts (
    id TEXT PRIMARY KEY,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL
  );

-- DROP TABLE IF EXISTS gifs;

CREATE TABLE IF NOT EXISTS
  gifs (
    id INTEGER PRIMARY KEY,
    file_id TEXT NOT NULL,
    description TEXT NOT NULL
  );

DROP INDEX IF EXISTS idx_gifs_file_id;

CREATE UNIQUE INDEX idx_gifs_file_id ON gifs (file_id);
