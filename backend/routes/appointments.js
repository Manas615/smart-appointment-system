const express = require("express");
const { body, query, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

// POST /api/appointments — book an appointment
router.post(
    "/",
    [
        body("patient_name").trim().notEmpty().withMessage("Patient name is required"),
        body("patient_email").isEmail().withMessage("Valid email is required"),
        body("provider_id").isInt().withMessage("Provider ID is required"),
        body("service_id").isInt().withMessage("Service ID is required"),
        body("slot_id").isInt().withMessage("Slot ID is required"),
        body("notes").optional().trim(),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { patient_name, patient_email, provider_id, service_id, slot_id, notes } = req.body;

            // Verify slot exists and is available
            const slot = db.prepare("SELECT * FROM time_slots WHERE id = ?").get(slot_id);
            if (!slot) {
                const err = new Error("Time slot not found");
                err.status = 404;
                return next(err);
            }
            if (!slot.is_available) {
                const err = new Error("Time slot is no longer available");
                err.status = 409;
                return next(err);
            }

            // Book the appointment within a transaction
            const book = db.transaction(() => {
                // Mark slot as unavailable
                db.prepare("UPDATE time_slots SET is_available = 0 WHERE id = ?").run(slot_id);

                // Create appointment
                const result = db
                    .prepare(
                        `INSERT INTO appointments (patient_name, patient_email, provider_id, service_id, slot_id, notes)
             VALUES (?, ?, ?, ?, ?, ?)`
                    )
                    .run(patient_name, patient_email, provider_id, service_id, slot_id, notes || null);

                return db
                    .prepare(
                        `SELECT a.*, p.name as provider_name, p.specialty, s.name as service_name,
                    s.duration_minutes, s.price, t.date, t.start_time, t.end_time
             FROM appointments a
             JOIN providers p ON a.provider_id = p.id
             JOIN services s ON a.service_id = s.id
             JOIN time_slots t ON a.slot_id = t.id
             WHERE a.id = ?`
                    )
                    .get(result.lastInsertRowid);
            });

            const appointment = book();
            res.status(201).json(appointment);
        } catch (err) {
            if (err.message.includes("UNIQUE constraint")) {
                const error = new Error("This time slot is already booked");
                error.status = 409;
                return next(error);
            }
            next(err);
        }
    }
);

// GET /api/appointments?email=... — list appointments for a patient
router.get(
    "/",
    [query("email").isEmail().withMessage("Valid email is required")],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const appointments = db
            .prepare(
                `SELECT a.*, p.name as provider_name, p.specialty, s.name as service_name,
                s.duration_minutes, s.price, t.date, t.start_time, t.end_time
         FROM appointments a
         JOIN providers p ON a.provider_id = p.id
         JOIN services s ON a.service_id = s.id
         JOIN time_slots t ON a.slot_id = t.id
         WHERE a.patient_email = ?
         ORDER BY t.date DESC, t.start_time DESC`
            )
            .all(req.query.email);

        res.json(appointments);
    }
);

// PATCH /api/appointments/:id/cancel — cancel an appointment
router.patch("/:id/cancel", (req, res, next) => {
    const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);

    if (!appointment) {
        const err = new Error("Appointment not found");
        err.status = 404;
        return next(err);
    }

    if (appointment.status === "cancelled") {
        const err = new Error("Appointment is already cancelled");
        err.status = 400;
        return next(err);
    }

    const cancel = db.transaction(() => {
        db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(req.params.id);
        db.prepare("UPDATE time_slots SET is_available = 1 WHERE id = ?").run(appointment.slot_id);

        return db
            .prepare(
                `SELECT a.*, p.name as provider_name, p.specialty, s.name as service_name,
                s.duration_minutes, s.price, t.date, t.start_time, t.end_time
         FROM appointments a
         JOIN providers p ON a.provider_id = p.id
         JOIN services s ON a.service_id = s.id
         JOIN time_slots t ON a.slot_id = t.id
         WHERE a.id = ?`
            )
            .get(req.params.id);
    });

    const updated = cancel();
    res.json(updated);
});

// PATCH /api/appointments/:id/reschedule — reschedule to a new slot
router.patch(
    "/:id/reschedule",
    [body("new_slot_id").isInt().withMessage("New slot ID is required")],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
        if (!appointment) {
            const err = new Error("Appointment not found");
            err.status = 404;
            return next(err);
        }
        if (appointment.status === "cancelled") {
            const err = new Error("Cannot reschedule a cancelled appointment");
            err.status = 400;
            return next(err);
        }

        const { new_slot_id } = req.body;
        const newSlot = db.prepare("SELECT * FROM time_slots WHERE id = ?").get(new_slot_id);
        if (!newSlot) {
            const err = new Error("New time slot not found");
            err.status = 404;
            return next(err);
        }
        if (!newSlot.is_available) {
            const err = new Error("New time slot is not available");
            err.status = 409;
            return next(err);
        }

        const reschedule = db.transaction(() => {
            // Free old slot
            db.prepare("UPDATE time_slots SET is_available = 1 WHERE id = ?").run(appointment.slot_id);
            // Reserve new slot
            db.prepare("UPDATE time_slots SET is_available = 0 WHERE id = ?").run(new_slot_id);
            // Update appointment
            db.prepare("UPDATE appointments SET slot_id = ? WHERE id = ?").run(new_slot_id, req.params.id);

            return db
                .prepare(
                    `SELECT a.*, p.name as provider_name, p.specialty, s.name as service_name,
                  s.duration_minutes, s.price, t.date, t.start_time, t.end_time
           FROM appointments a
           JOIN providers p ON a.provider_id = p.id
           JOIN services s ON a.service_id = s.id
           JOIN time_slots t ON a.slot_id = t.id
           WHERE a.id = ?`
                )
                .get(req.params.id);
        });

        const result = reschedule();
        res.json(result);
    }
);

// GET /api/appointments/provider/:providerId — provider schedule (issues #12, #13)
router.get("/provider/:providerId", (req, res) => {
    const { date } = req.query;
    const todayStr = new Date().toISOString().split("T")[0];

    let sql = `SELECT a.*, p.name as provider_name, p.specialty, s.name as service_name,
                      s.duration_minutes, s.price, t.date, t.start_time, t.end_time
               FROM appointments a
               JOIN providers p ON a.provider_id = p.id
               JOIN services s ON a.service_id = s.id
               JOIN time_slots t ON a.slot_id = t.id
               WHERE a.provider_id = ? AND a.status = 'confirmed'`;
    const params = [req.params.providerId];

    if (date) {
        sql += " AND t.date = ?";
        params.push(date);
    } else {
        sql += " AND t.date >= ?";
        params.push(todayStr);
    }

    sql += " ORDER BY t.date ASC, t.start_time ASC";

    const appointments = db.prepare(sql).all(...params);
    res.json(appointments);
});

module.exports = router;

