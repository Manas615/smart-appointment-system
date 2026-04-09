const express = require("express");
const { body, query, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

// GET /api/slots/provider/:providerId?date=YYYY-MM-DD — list available slots
router.get(
  "/provider/:providerId",
  [query("date").optional().isISO8601().withMessage("Date must be YYYY-MM-DD")],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { providerId } = req.params;
    const { date } = req.query;
    const showAll = req.query.all === "1";

    let sql = "SELECT * FROM time_slots WHERE provider_id = ?";
    if (!showAll) {
      sql += " AND is_available = 1";
    }
    const params = [providerId];

    if (date) {
      sql += " AND date = ?";
      params.push(date);
    }

    sql += " ORDER BY date, start_time";
    const slots = db.prepare(sql).all(...params);
    res.json(slots);
  }
);

// GET /api/slots/dates/:providerId — list distinct available dates
router.get("/dates/:providerId", (req, res) => {
  const dates = db
    .prepare(
      "SELECT DISTINCT date FROM time_slots WHERE provider_id = ? AND is_available = 1 ORDER BY date"
    )
    .all(req.params.providerId);
  res.json(dates.map((d) => d.date));
});

// POST /api/slots — create time slots (batch)
router.post(
  "/",
  [
    body("provider_id").isInt().withMessage("Provider ID is required"),
    body("date").isISO8601().withMessage("Date must be YYYY-MM-DD"),
    body("slots").isArray({ min: 1 }).withMessage("At least one slot is required"),
    body("slots.*.start_time")
      .matches(/^\d{2}:\d{2}$/)
      .withMessage("start_time must be HH:MM"),
    body("slots.*.end_time")
      .matches(/^\d{2}:\d{2}$/)
      .withMessage("end_time must be HH:MM"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { provider_id, date, slots } = req.body;

      const insert = db.prepare(
        "INSERT INTO time_slots (provider_id, date, start_time, end_time) VALUES (?, ?, ?, ?)"
      );

      const insertMany = db.transaction((slotList) => {
        const created = [];
        for (const slot of slotList) {
          const result = insert.run(provider_id, date, slot.start_time, slot.end_time);
          created.push({
            id: result.lastInsertRowid,
            provider_id,
            date,
            ...slot,
            is_available: 1,
          });
        }
        return created;
      });

      const created = insertMany(slots);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/slots/:id — remove a time slot (issue #10)
router.delete("/:id", (req, res, next) => {
  const slot = db.prepare("SELECT * FROM time_slots WHERE id = ?").get(req.params.id);
  if (!slot) {
    const err = new Error("Time slot not found");
    err.status = 404;
    return next(err);
  }

  if (!slot.is_available) {
    const err = new Error("Cannot delete a slot that is already booked");
    err.status = 400;
    return next(err);
  }

  db.prepare("DELETE FROM time_slots WHERE id = ?").run(req.params.id);
  res.json({ message: "Time slot deleted", id: Number(req.params.id) });
});

module.exports = router;
