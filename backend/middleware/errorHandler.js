/**
 * Centralized error-handling middleware.
 * Returns consistent JSON error responses.
 */
function errorHandler(err, req, res, _next) {
    console.error(`[ERROR] ${err.message}`);

    const status = err.status || 500;
    res.status(status).json({
        error: {
            message: err.message || "Internal Server Error",
            status,
        },
    });
}

module.exports = errorHandler;
