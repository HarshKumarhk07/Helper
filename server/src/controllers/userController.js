import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { email: { $regex: q, $options: 'i' } },
  ];
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ users: users.map((u) => u.toSafeJSON()) });
});

export const adminCreateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, aadhaarNumber, panNumber, passportPhoto, kycStatus, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already in use');
  const user = await User.create({
    name,
    email,
    phone,
    aadhaarNumber,
    panNumber,
    passportPhoto,
    kycStatus,
    password,
    role,
  });
  res.status(201).json({ user: user.toSafeJSON() });
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  const user = await User.findById(id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const isManager = req.user.role === 'manager';
  if (isManager && user.role === 'admin') {
    throw new ApiError(403, 'Managers cannot edit admin accounts');
  }
  if (isManager && updates.role === 'admin') {
    throw new ApiError(403, 'Managers cannot promote users to admin');
  }

  if (updates.email && updates.email !== user.email) {
    const emailExists = await User.findOne({ email: updates.email, _id: { $ne: id } });
    if (emailExists) throw new ApiError(409, 'Email already in use');
  }

  if (updates.password === '') delete updates.password;
  if ('password' in updates && !updates.password) delete updates.password;

  if (updates.passportPhoto) {
    updates.avatar = updates.passportPhoto;
  } else if (updates.avatar && !updates.passportPhoto) {
    updates.passportPhoto = updates.avatar;
  }

  Object.assign(user, updates);
  await user.save();

  res.json({ user: user.toSafeJSON() });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updates = req.body;
  Object.assign(req.user, updates);
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  // Prevent administrators from suspending their own account.
  if (String(req.user._id) === String(id) && isActive === false) {
    throw new ApiError(400, 'Admin cannot suspend their own account');
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: !!isActive },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: user.toSafeJSON() });
});
