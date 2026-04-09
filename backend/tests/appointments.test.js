const request = require("supertest");
const express = require("express");
const Database = require("better-sqlite3");

// ── Build an in-memory DB with the real schema ────────────────────────────────
function buildTestDb() {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
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

  return db;
}

// ── Seed helper ───────────────────────────────────────────────────────────────
function seedDb(db) {
  const provider = db
    .prepare("INSERT INTO providers (name, specialty, email) VALUES (?, ?, ?)")
    .run("Dr. Test", "General", "test@clinic.com");

  const service = db
    .prepare(
      "INSERT INTO services (provider_id, name, duration_minutes, price) VALUES (?, ?, ?, ?)"
    )
    .run(provider.lastInsertRowid, "Consultation", 30, 50);

  const slot = db
    .prepare(
      "INSERT INTO time_slots (provider_id, date, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)"
    )
    .run(provider.lastInsertRowid, "2027-01-15", "09:00", "09:30", 1);

  return {
    providerId: provider.lastInsertRowid,
    serviceId: service.lastInsertRowid,
    slotId: slot.lastInsertRowid,
  };
}

// ── Build a testable Express app (routes wired with injected db) ──────────────
function buildApp(dbInstance) {
  const dbProxy = require("../db");
  dbProxy.setTestDb(dbInstance);
  return require("../index");
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Appointments API", () => {
  let db, app, ids;

  beforeEach(() => {
    db = buildTestDb();
    ids = seedDb(db);
    app = buildApp(db);
  });

  afterEach(() => {
    db.close();
  });

  // ── POST /api/appointments ──────────────────────────────────────────────────
  describe("POST /api/appointments", () => {
    it("books a valid appointment and returns 201", async () => {
      const res = await request(app).post("/api/appointments").send({
        patient_name: "Alice Smith",
        patient_email: "alice@example.com",
        provider_id: ids.providerId,
        service_id: ids.serviceId,
        slot_id: ids.slotId,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.patient_name).toBe("Alice Smith");
      expect(res.body.provider_name).toBe("Dr. Test");
    });

    it("returns 400 when required fields are missing", async () => {
      const res = await request(app).post("/api/appointments").send({
        patient_name: "Alice Smith",
        // missing email, provider_id, service_id, slot_id
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("returns 400 for invalid email format", async () => {
      const res = await request(app).post("/api/appointments").send({
        patient_name: "Bob",
        patient_email: "not-an-email",
        provider_id: ids.providerId,
        service_id: ids.serviceId,
        slot_id: ids.slotId,
      });

      expect(res.statusCode).toBe(400);
    });

    it("returns 409 when booking the same slot twice (double-booking prevention)", async () => {
      const payload = {
        patient_name: "Alice",
        patient_email: "alice@example.com",
        provider_id: ids.providerId,
        service_id: ids.serviceId,
        slot_id: ids.slotId,
      };

      await request(app).post("/api/appointments").send(payload);

      const res = await request(app)
        .post("/api/appointments")
        .send({
          ...payload,
          patient_name: "Bob",
          patient_email: "bob@example.com",
        });

      expect(res.statusCode).toBe(409);
    });

    it("returns 404 for a non-existent slot", async () => {
      const res = await request(app).post("/api/appointments").send({
        patient_name: "Alice",
        patient_email: "alice@example.com",
        provider_id: ids.providerId,
        service_id: ids.serviceId,
        slot_id: 99999,
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /api/appointments/:id/cancel ─────────────────────────────────────
  describe("PATCH /api/appointments/:id/cancel", () => {
    let appointmentId;

    beforeEach(async () => {
      const res = await request(app).post("/api/appointments").send({
        patient_name: "Alice",
        patient_email: "alice@example.com",
        provider_id: ids.providerId,
        service_id: ids.serviceId,
        slot_id: ids.slotId,
      });
      appointmentId = res.body.id;
    });

    it("cancels an existing appointment and returns updated record", async () => {
      const res = await request(app).patch(`/api/appointments/${appointmentId}/cancel`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("cancelled");
    });

    it("frees the slot after cancellation", async () => {
      await request(app).patch(`/api/appointments/${appointmentId}/cancel`);
      const slot = db.prepare("SELECT * FROM time_slots WHERE id = ?").get(ids.slotId);
      expect(slot.is_available).toBe(1);
    });

    it("returns 404 for a non-existent appointment", async () => {
      const res = await request(app).patch("/api/appointments/99999/cancel");
      expect(res.statusCode).toBe(404);
    });

    it("returns 400 when cancelling an already-cancelled appointment", async () => {
      await request(app).patch(`/api/appointments/${appointmentId}/cancel`);
      const res = await request(app).patch(`/api/appointments/${appointmentId}/cancel`);
      expect(res.statusCode).toBe(400);
    });
  });

  // ── GET /api/appointments?email= ───────────────────────────────────────────
  describe("GET /api/appointments", () => {
    it("returns appointments for a valid email", async () => {
      await request(app).post("/api/appointments").send({
        patient_name: "Alice",
        patient_email: "alice@example.com",
        provider_id: ids.providerId,
        service_id: ids.serviceId,
        slot_id: ids.slotId,
      });

      const res = await request(app).get("/api/appointments?email=alice@example.com");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it("returns empty array for an email with no appointments", async () => {
      const res = await request(app).get("/api/appointments?email=nobody@example.com");
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 400 for an invalid email query param", async () => {
      const res = await request(app).get("/api/appointments?email=not-valid");
      expect(res.statusCode).toBe(400);
    });
  });
});
