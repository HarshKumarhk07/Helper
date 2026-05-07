import { ApiError } from '../utils/asyncHandler.js';

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  // Handle MongoDB duplicate key errors (E11000)
  if (err.code === 11000) {
    status = 400;
    const field = Object.keys(err.keyPattern || {})[0];
    const duplicateValue = err.keyValue || {};
    
    if (field === 'slug' && duplicateValue.category) {
      message = 'A service with this slug already exists in this category. Please choose a unique slug.';
    } else if (field === 'slug') {
      message = 'A service with this slug already exists. Please choose a unique slug.';
    } else {
      message = `Duplicate value for field: ${field}`;
    }
    details = { field, value: duplicateValue[field] };
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.entries(err.errors || {}).map(([field, error]) => ({
      field,
      message: error.message,
    }));
  }

  // Handle MongoDB cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.kind || 'value'}: ${err.value}`;
  }

  const payload = {
    error: message,
  };
  if (details) payload.details = details;
  if (process.env.NODE_ENV !== 'production' && status === 500) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
};
