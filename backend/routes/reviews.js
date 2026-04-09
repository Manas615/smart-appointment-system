const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

// POST /api/reviews — submit a review for a completed appointment
router.post(
  "/",
  [
    body("appointment_id").isInt().withMessage("Appointment ID is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").optional().trim(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { appointment_id, rating, comment } = req.body;

      // Verify appointment exists
      const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(appointment_id);
      if (!appointment) {
        const err = new Error("Appointment not found");
        err.status = 404;
        return next(err);
      }

      // Check not already reviewed
      const existing = db
        .prepare("SELECT id FROM reviews WHERE appointment_id = ?")
        .get(appointment_id);
      if (existing) {
        const err = new Error("This appointment has already been reviewed");
        err.status = 409;
        return next(err);
      }

      const result = db
        .prepare(
          `INSERT INTO reviews (appointment_id, provider_id, patient_name, patient_email, rating, comment)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          appointment_id,
          appointment.provider_id,
          appointment.patient_name,
          appointment.patient_email,
          rating,
          comment || null
        );

      const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(result.lastInsertRowid);
      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/reviews/provider/:providerId — get reviews for a provider
router.get("/provider/:providerId", (req, res) => {
  const reviews = db
    .prepare("SELECT * FROM reviews WHERE provider_id = ? ORDER BY created_at DESC")
    .all(req.params.providerId);

  const stats = db
    .prepare(
      `SELECT COUNT(*) as count, ROUND(AVG(rating), 1) as average
       FROM reviews WHERE provider_id = ?`
    )
    .get(req.params.providerId);

  res.json({ reviews, stats });
});

module.exports = router;
