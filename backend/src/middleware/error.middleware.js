const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Erreur interne du serveur",
    ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
  });
};

module.exports = errorHandler;