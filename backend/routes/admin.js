const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

// GET /api/admin/appointments — list all appointments (issue #16)
router.get("/appointments", (req, res) => {
  const appointments = db
    .prepare(
      `SELECT a.*, p.name as provider_name, p.specialty, s.name as service_name,
                    s.duration_minutes, s.price, t.date, t.start_time, t.end_time
             FROM appointments a
             JOIN providers p ON a.provider_id = p.id
             JOIN services s ON a.service_id = s.id
             JOIN time_slots t ON a.slot_id = t.id
             ORDER BY a.created_at DESC`
    )
    .all();

  res.json(appointments);
});

// DELETE /api/admin/appointments/:id — delete an appointment (issue #16)
router.delete("/appointments/:id", (req, res, next) => {
  const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    return next(err);
  }

  const remove = db.transaction(() => {
    // Free the slot
    db.prepare("UPDATE time_slots SET is_available = 1 WHERE id = ?").run(appointment.slot_id);
    // Delete associated reviews
    db.prepare("DELETE FROM reviews WHERE appointment_id = ?").run(req.params.id);
    // Delete appointment
    db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
  });

  remove();
  res.json({ message: "Appointment deleted", id: Number(req.params.id) });
});

// PUT /api/admin/providers/:id — update a provider (issue #17)
router.put(
  "/providers/:id",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("specialty").trim().notEmpty().withMessage("Specialty is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").optional().trim(),
    body("bio").optional().trim(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = db.prepare("SELECT * FROM providers WHERE id = ?").get(req.params.id);
    if (!existing) {
      const err = new Error("Provider not found");
      err.status = 404;
      return next(err);
    }

    try {
      const { name, specialty, email, phone, bio } = req.body;
      db.prepare(
        "UPDATE providers SET name = ?, specialty = ?, email = ?, phone = ?, bio = ? WHERE id = ?"
      ).run(name, specialty, email, phone || null, bio || null, req.params.id);

      const provider = db.prepare("SELECT * FROM providers WHERE id = ?").get(req.params.id);
      res.json(provider);
    } catch (err) {
      if (err.message.includes("UNIQUE constraint")) {
        const error = new Error("A provider with this email already exists");
        error.status = 409;
        return next(error);
      }
      next(err);
    }
  }
);

// DELETE /api/admin/providers/:id — delete a provider (issue #17)
router.delete("/providers/:id", (req, res, next) => {
  const provider = db.prepare("SELECT * FROM providers WHERE id = ?").get(req.params.id);
  if (!provider) {
    const err = new Error("Provider not found");
    err.status = 404;
    return next(err);
  }

  // CASCADE will handle services, time_slots; appointments have no CASCADE so check first
  const activeAppointments = db
    .prepare(
      "SELECT COUNT(*) as count FROM appointments WHERE provider_id = ? AND status = 'confirmed'"
    )
    .get(req.params.id).count;

  if (activeAppointments > 0) {
    const err = new Error(
      `Cannot delete provider with ${activeAppointments} active appointment(s). Cancel them first.`
    );
    err.status = 400;
    return next(err);
  }

  db.prepare("DELETE FROM reviews WHERE provider_id = ?").run(req.params.id);
  db.prepare("DELETE FROM appointments WHERE provider_id = ?").run(req.params.id);
  db.prepare("DELETE FROM providers WHERE id = ?").run(req.params.id);

  res.json({ message: "Provider deleted", id: Number(req.params.id) });
});

// GET /api/admin/reports — summary report (issue #18)
router.get("/reports", (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const totalRevenue = db
    .prepare(
      `SELECT COALESCE(SUM(s.price), 0) as total
             FROM appointments a
             JOIN services s ON a.service_id = s.id
             WHERE a.status = 'confirmed'`
    )
    .get().total;

  const bookingsByDate = db
    .prepare(
      `SELECT t.date, COUNT(*) as count
             FROM appointments a
             JOIN time_slots t ON a.slot_id = t.id
             GROUP BY t.date
             ORDER BY t.date DESC
             LIMIT 30`
    )
    .all();

  const bookingsByProvider = db
    .prepare(
      `SELECT p.name, p.specialty, COUNT(a.id) as count,
                    COALESCE(SUM(s.price), 0) as revenue
             FROM providers p
             LEFT JOIN appointments a ON p.id = a.provider_id AND a.status = 'confirmed'
             LEFT JOIN services s ON a.service_id = s.id
             GROUP BY p.id
             ORDER BY count DESC`
    )
    .all();

  const bookingsByService = db
    .prepare(
      `SELECT s.name, COUNT(a.id) as count, s.price,
                    COALESCE(SUM(s.price), 0) as revenue
             FROM services s
             LEFT JOIN appointments a ON s.id = a.service_id AND a.status = 'confirmed'
             GROUP BY s.id
             ORDER BY count DESC
             LIMIT 15`
    )
    .all();

  const cancellationRate = db
    .prepare(
      `SELECT
               COUNT(*) as total,
               SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
             FROM appointments`
    )
    .get();

  res.json({
    totalRevenue,
    cancellationRate: cancellationRate.total
      ? Math.round((cancellationRate.cancelled / cancellationRate.total) * 100)
      : 0,
    bookingsByDate,
    bookingsByProvider,
    bookingsByService,
  });
});

// GET /api/admin/activity — recent system activity (issue #19)
router.get("/activity", (req, res) => {
  const recentAppointments = db
    .prepare(
      `SELECT 'appointment' as type, a.id, a.patient_name as actor,
                    a.status, a.created_at as timestamp,
                    s.name as service_name, p.name as provider_name
             FROM appointments a
             JOIN services s ON a.service_id = s.id
             JOIN providers p ON a.provider_id = p.id
             ORDER BY a.created_at DESC
             LIMIT 20`
    )
    .all();

  const recentReviews = db
    .prepare(
      `SELECT 'review' as type, r.id, r.patient_name as actor,
                    r.rating, r.created_at as timestamp,
                    p.name as provider_name
             FROM reviews r
             JOIN providers p ON r.provider_id = p.id
             ORDER BY r.created_at DESC
             LIMIT 10`
    )
    .all();

  // Merge and sort by timestamp
  const activity = [...recentAppointments, ...recentReviews]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 25);

  res.json(activity);
});

module.exports = router;
