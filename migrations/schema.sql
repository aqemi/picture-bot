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
  createdAt < datetime ('now', '-1 day');

END;

DROP TABLE IF EXISTS prompts;

CREATE TABLE
  prompts (
    id TEXT PRIMARY KEY,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL
  );