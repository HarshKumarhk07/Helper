import Faq from '../models/Faq.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

// Public Route
export const getPublicFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  res.json({ faqs });
});

// Admin Routes
export const getAllFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find().sort({ order: 1, createdAt: -1 }).lean();
  res.json({ faqs });
});

export const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, isActive, order } = req.body;
  const faq = await Faq.create({ question, answer, isActive, order });
  res.status(201).json({ faq });
});

export const updateFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const faq = await Faq.findByIdAndUpdate(id, req.body, { new: true });
  if (!faq) throw new ApiError(404, 'FAQ not found');
  res.json({ faq });
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) throw new ApiError(404, 'FAQ not found');
  res.json({ success: true });
});
