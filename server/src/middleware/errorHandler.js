export const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const message = statusCode >= 500
    ? 'Internal Server Error'
    : err.message || 'Request could not be processed.';
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
