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
  const { name, email, phone, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already in use');
  const user = await User.create({ name, email, phone, password, role });
  res.status(201).json({ user: user.toSafeJSON() });
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
