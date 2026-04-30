import Address from '../models/Address.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

export const listMine = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({
    isDefault: -1,
    updatedAt: -1,
  });
  res.json({ addresses });
});

export const createAddress = asyncHandler(async (req, res) => {
  const payload = { ...req.body, user: req.user._id };
  if (payload.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }
  const addr = await Address.create(payload);
  res.status(201).json({ address: addr });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const owned = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!owned) throw new ApiError(404, 'Address not found');
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }
  Object.assign(owned, req.body);
  await owned.save();
  res.json({ address: owned });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const result = await Address.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!result) throw new ApiError(404, 'Address not found');
  res.json({ ok: true });
});
