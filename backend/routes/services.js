const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

// GET /api/providers/:id/services — list services for a provider
router.get("/provider/:providerId", (req, res) => {
  const services = db
    .prepare("SELECT * FROM services WHERE provider_id = ? ORDER BY name")
    .all(req.params.providerId);
  res.json(services);
});

// POST /api/services — create a service
router.post(
  "/",
  [
    body("provider_id").isInt().withMessage("Provider ID is required"),
    body("name").trim().notEmpty().withMessage("Service name is required"),
    body("duration_minutes")
      .isInt({ min: 5, max: 480 })
      .withMessage("Duration must be between 5 and 480 minutes"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be non-negative"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { provider_id, name, duration_minutes, price } = req.body;

      // Verify provider exists
      const provider = db.prepare("SELECT id FROM providers WHERE id = ?").get(provider_id);
      if (!provider) {
        const err = new Error("Provider not found");
        err.status = 404;
        return next(err);
      }

      const result = db
        .prepare(
          "INSERT INTO services (provider_id, name, duration_minutes, price) VALUES (?, ?, ?, ?)"
        )
        .run(provider_id, name, duration_minutes, price);

      const service = db.prepare("SELECT * FROM services WHERE id = ?").get(result.lastInsertRowid);
      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
