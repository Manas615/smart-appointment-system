const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/dashboard/stats — aggregate statistics
router.get("/stats", (req, res) => {
  const totalProviders = db.prepare("SELECT COUNT(*) as count FROM providers").get().count;

  const totalAppointments = db.prepare("SELECT COUNT(*) as count FROM appointments").get().count;

  const confirmedAppointments = db
    .prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'")
    .get().count;

  const cancelledAppointments = db
    .prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'")
    .get().count;

  const totalServices = db.prepare("SELECT COUNT(*) as count FROM services").get().count;

  const totalReviews = db.prepare("SELECT COUNT(*) as count FROM reviews").get().count;

  const averageRating =
    db.prepare("SELECT ROUND(AVG(rating), 1) as average FROM reviews").get().average || 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = db
    .prepare(
      `SELECT COUNT(*) as count FROM appointments a
       JOIN time_slots t ON a.slot_id = t.id
       WHERE t.date = ? AND a.status = 'confirmed'`
    )
    .get(todayStr).count;

  const availableSlots = db
    .prepare(
      `SELECT COUNT(*) as count FROM time_slots
       WHERE is_available = 1 AND date >= ?`
    )
    .get(todayStr).count;

  res.json({
    totalProviders,
    totalAppointments,
    confirmedAppointments,
    cancelledAppointments,
    totalServices,
    totalReviews,
    averageRating,
    todayAppointments,
    availableSlots,
  });
});

// GET /api/dashboard/recent — recent appointments
router.get("/recent", (req, res) => {
  const recent = db
    .prepare(
      `SELECT a.*, p.name as provider_name, p.specialty, s.name as service_name,
              t.date, t.start_time, t.end_time
       FROM appointments a
       JOIN providers p ON a.provider_id = p.id
       JOIN services s ON a.service_id = s.id
       JOIN time_slots t ON a.slot_id = t.id
       ORDER BY a.created_at DESC LIMIT 10`
    )
    .all();

  res.json(recent);
});

// GET /api/dashboard/popular-providers — providers ranked by appointment count
router.get("/popular-providers", (req, res) => {
  const popular = db
    .prepare(
      `SELECT p.id, p.name, p.specialty, COUNT(a.id) as appointment_count,
              ROUND(AVG(r.rating), 1) as avg_rating
       FROM providers p
       LEFT JOIN appointments a ON p.id = a.provider_id
       LEFT JOIN reviews r ON p.id = r.provider_id
       GROUP BY p.id
       ORDER BY appointment_count DESC`
    )
    .all();

  res.json(popular);
});

// GET /api/dashboard/specialty-distribution — appointments by specialty
router.get("/specialty-distribution", (req, res) => {
  const distribution = db
    .prepare(
      `SELECT p.specialty, COUNT(a.id) as count
       FROM providers p
       LEFT JOIN appointments a ON p.id = a.provider_id
       GROUP BY p.specialty
       ORDER BY count DESC`
    )
    .all();

  res.json(distribution);
});

module.exports = router;
