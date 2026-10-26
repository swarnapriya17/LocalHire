/**
 * 404 Not Found Middleware
 * Intercepts requests to unregistered endpoints and returns structured JSON
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      statusCode: 404
    }
  });
};
