const Database = require("better-sqlite3");

const db = new Database("mellowbean.db");
// =====================================================
// SQLITE SECURITY / CONCURRENCY SETTINGS
// =====================================================

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.prepare(`
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        guests INTEGER NOT NULL,
        message TEXT
    )
`).run();

console.log("Database connected successfully!");

module.exports = db;
// =========================
// ADD STATUS TO RESERVATIONS
// =========================

try {

    db.prepare(`
        ALTER TABLE reservations
        ADD COLUMN status TEXT DEFAULT 'Pending'
    `).run();

    console.log("Status column added.");

} catch (error) {

    // Column already exists
    if (!error.message.includes("duplicate column name")) {
        console.error(error);
    }

}