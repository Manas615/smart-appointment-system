const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../db");

const router = express.Router();

// GET /api/providers — list all providers
router.get("/", (req, res) => {
    const providers = db.prepare("SELECT * FROM providers ORDER BY name").all();
    res.json(providers);
});

// GET /api/providers/:id — get single provider with services
router.get("/:id", (req, res, next) => {
    const provider = db.prepare("SELECT * FROM providers WHERE id = ?").get(req.params.id);
    if (!provider) {
        const err = new Error("Provider not found");
        err.status = 404;
        return next(err);
    }

    const services = db
        .prepare("SELECT * FROM services WHERE provider_id = ?")
        .all(req.params.id);

    res.json({ ...provider, services });
});

// POST /api/providers — create a new provider
router.post(
    "/",
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

        try {
            const { name, specialty, email, phone, bio } = req.body;
            const result = db
                .prepare(
                    "INSERT INTO providers (name, specialty, email, phone, bio) VALUES (?, ?, ?, ?, ?)"
                )
                .run(name, specialty, email, phone || null, bio || null);

            const provider = db.prepare("SELECT * FROM providers WHERE id = ?").get(result.lastInsertRowid);
            res.status(201).json(provider);
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

module.exports = router;
