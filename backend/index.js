const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Initialize database (creates tables on first require)
const db = require("./db");

const providersRouter = require("./routes/providers");
const servicesRouter = require("./routes/services");
const slotsRouter = require("./routes/slots");
const appointmentsRouter = require("./routes/appointments");
const reviewsRouter = require("./routes/reviews");
const dashboardRouter = require("./routes/dashboard");
const adminRouter = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat));
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/providers", providersRouter);
app.use("/api/services", servicesRouter);
app.use("/api/slots", slotsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/admin", adminRouter);

// 404 handler for unknown API routes
app.use("/api/{*path}", (req, res) => {
  res.status(404).json({ error: { message: "API route not found", status: 404 } });
});

// Error handler
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
