const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file (auto-created on first run)
const db = new sqlite3.Database(path.join(__dirname, "../batterbee.db"));

// Create table if it doesn't exist
db.run(`
CREATE TABLE IF NOT EXISTS users (
  discordId TEXT PRIMARY KEY,
  robloxName TEXT,
  robloxId TEXT,
  code TEXT,
  verified INTEGER DEFAULT 0,
  createdAt INTEGER
)
`);

module.exports = {

  // Save or update user
  upsertUser(discordId, robloxName, robloxId, code) {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO users (discordId, robloxName, robloxId, code, verified, createdAt)
        VALUES (?, ?, ?, ?, 0, ?)
        ON CONFLICT(discordId) DO UPDATE SET
          robloxName=excluded.robloxName,
          robloxId=excluded.robloxId,
          code=excluded.code
        `,
        [discordId, robloxName, robloxId, code, Date.now()],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  },

  // Get user
  getUser(discordId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE discordId = ?`,
        [discordId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Mark verified
  setVerified(discordId, value = 1) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET verified = ? WHERE discordId = ?`,
        [value, discordId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  },

  // Remove user (unverify)
  deleteUser(discordId) {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM users WHERE discordId = ?`,
        [discordId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }
};