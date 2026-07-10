import { ApiError } from '../utils/asyncHandler.js';

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => {
      const rawPath = i.path.join('.');
      let label = rawPath;

      // Map common paths to clean field names
      const labelMap = {
        name: 'Full Name',
        email: 'Email Address',
        phone: 'Phone Number',
        password: 'Password',
        aadhaarNumber: 'Aadhaar Number',
        panNumber: 'PAN Number',
        companyName: 'Company Name',
        companyAddress: 'Company Address',
        businessType: 'Business Type',
        passportPhoto: 'Passport Photo',
        role: 'Role',
        experienceYears: 'Years of Experience',
        address: 'Address',
        education: 'Education',
      };

      if (labelMap[rawPath]) {
        label = labelMap[rawPath];
      } else if (rawPath) {
        label = rawPath
          .replace(/([A-Z])/g, ' $1')
          .replace(/[_-]/g, ' ')
          .replace(/^\w/, (c) => c.toUpperCase());
      }

      // Build clean message
      let msg = i.message;
      if (i.code === 'too_small' && i.type === 'string') {
        msg = `must be at least ${i.minimum} character${i.minimum === 1 ? '' : 's'}`;
      } else if (i.code === 'too_big' && i.type === 'string') {
        msg = `cannot exceed ${i.maximum} character${i.maximum === 1 ? '' : 's'}`;
      } else if (i.message === 'Invalid email' || (i.code === 'invalid_string' && i.validation === 'email')) {
        msg = 'must be a valid email address';
      } else if (i.message === 'Invalid' || i.message === 'Required') {
        msg = 'is invalid';
      }

      return {
        path: rawPath,
        message: label ? `${label}: ${msg}` : msg,
      };
    });
    return next(new ApiError(400, 'Validation failed', details));
  }
  req.body = result.data;
  next();
};
