import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { computeSlotsForService } from '../utils/slots.js';

export const getServiceSlots = asyncHandler(async (req, res) => {
  const { serviceId, date } = req.query;
  if (!serviceId) throw new ApiError(400, 'serviceId is required');
  if (!date) throw new ApiError(400, 'date is required (YYYY-MM-DD)');

  try {
    const result = await computeSlotsForService({ serviceId, date });
    res.json(result);
  } catch (err) {
    if (err.status) throw new ApiError(err.status, err.message);
    throw err;
  }
});
