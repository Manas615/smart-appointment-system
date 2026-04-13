const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const defaultDbDir = path.join(__dirname, "data");
const dbFile = process.env.DB_PATH || path.join(defaultDbDir, "appointments.db");
const dbDir = path.dirname(dbFile);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Default to the real database
let activeDb = new Database(dbFile);

// Enable WAL mode for better concurrency
activeDb.pragma("journal_mode = WAL");
activeDb.pragma("foreign_keys = ON");

// Create tables
activeDb.exec(`
  CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_available INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    provider_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL UNIQUE,
    provider_id INTEGER NOT NULL,
    patient_name TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (provider_id) REFERENCES providers(id)
  );
`);

// Export a proxy so we can mathematically guarantee DI works seamlessly in tests
const dbProxy = new Proxy(
  {
    setTestDb: (testDb) => {
      activeDb = testDb;
    },
  },
  {
    get(target, prop) {
      if (prop === "setTestDb") {
        return function (testDb) {
          activeDb = testDb;
        };
      }
      const val = activeDb[prop];
      if (typeof val === "function") {
        return val.bind(activeDb);
      }
      return val;
    },
  }
);

module.exports = dbProxy;
