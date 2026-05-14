import Address from '../models/Address.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { geocodeAddress } from '../utils/geocoding.js';

const hasCoords = (lat, lng) =>
  typeof lat === 'number' &&
  Number.isFinite(lat) &&
  typeof lng === 'number' &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

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

  // Geocode address if lat/lng are missing
  if (!hasCoords(payload.lat, payload.lng)) {
    const addressStr = `${payload.line1}, ${payload.line2 || ''}, ${payload.city}, ${payload.state || ''}, ${payload.pincode}`.replace(/,\s*,/g, ',');
    const coords = await geocodeAddress(addressStr);
    if (coords) {
      payload.lat = coords.lat;
      payload.lng = coords.lng;
    }
  }

  if (!hasCoords(payload.lat, payload.lng)) {
    throw new ApiError(400, 'Could not resolve location coordinates for this address');
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

  // If address changed and lat/lng not explicitly provided, re-geocode
  if ((req.body.line1 || req.body.city || req.body.pincode) && !hasCoords(req.body.lat, req.body.lng)) {
    const pLine1 = req.body.line1 || owned.line1;
    const pLine2 = req.body.line2 || owned.line2 || '';
    const pCity = req.body.city || owned.city;
    const pState = req.body.state || owned.state || '';
    const pPincode = req.body.pincode || owned.pincode;
    
    const addressStr = `${pLine1}, ${pLine2}, ${pCity}, ${pState}, ${pPincode}`.replace(/,\s*,/g, ',');
    const coords = await geocodeAddress(addressStr);
    if (coords) {
      req.body.lat = coords.lat;
      req.body.lng = coords.lng;
    }
  }

  const nextLat = req.body.lat ?? owned.lat;
  const nextLng = req.body.lng ?? owned.lng;
  if (!hasCoords(nextLat, nextLng)) {
    throw new ApiError(400, 'Could not resolve location coordinates for this address');
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
