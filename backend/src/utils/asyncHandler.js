/**
 * Wraps an async Express route handler so any thrown error / rejected
 * promise is automatically forwarded to the centralized error handler
 * middleware via next(err), instead of needing try/catch in every controller.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
