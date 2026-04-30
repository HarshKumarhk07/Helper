import crypto from 'crypto';

export const generatePin = (digits = 6) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits;
  return crypto.randomInt(min, max).toString();
};
