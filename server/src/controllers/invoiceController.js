import PDFDocument from 'pdfkit';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import fs from 'fs';

export const generateInvoice = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  
  let data;
  if (type === 'order') {
    data = await Order.findById(id).populate('user', 'name email');
  } else if (type === 'booking') {
    data = await Booking.findById(id).populate('user', 'name email').populate('service', 'name price');
  } else {
    throw new ApiError(400, 'Invalid invoice type');
  }

  if (!data) throw new ApiError(404, 'Record not found');

  // Verify ownership
  if (req.user.role !== 'admin' && String(data.user._id) !== String(req.user._id)) {
    throw new ApiError(403, 'Forbidden');
  }

  const doc = new PDFDocument({ margin: 50 });
  const filename = `Invoice_${type.toUpperCase()}_${data.orderId || data.code}.pdf`;

  res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-type', 'application/pdf');

  doc.pipe(res);

  // Header
  doc
    .fillColor('#18181a')
    .fontSize(28)
    .text('HELPER', { align: 'right' })
    .fontSize(10)
    .text('Luxury Minimal Services', { align: 'right' })
    .moveDown();

  doc
    .fontSize(20)
    .text('INVOICE', 50, 150);

  doc
    .fontSize(10)
    .text(`Invoice Number: INV-${data.orderId || data.code}`, 50, 200)
    .text(`Date: ${new Date(data.createdAt).toLocaleDateString()}`, 50, 215)
    .text(`Status: ${data.status.toUpperCase()}`, 50, 230);

  // Customer Details
  doc
    .text('Bill To:', 300, 200)
    .text(data.user.name, 300, 215)
    .text(data.user.email, 300, 230);

  const address = data.address;
  if (address) {
    doc.text(`${address.line1}, ${address.city}, ${address.pincode}`, 300, 245);
  }

  doc.moveDown(3);

  // Items
  const tableTop = 330;
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Description', 50, tableTop)
    .text('Quantity', 280, tableTop, { width: 90, align: 'right' })
    .text('Unit Price', 370, tableTop, { width: 90, align: 'right' })
    .text('Amount', 470, tableTop, { width: 90, align: 'right' });

  doc
    .moveTo(50, tableTop + 15)
    .lineTo(560, tableTop + 15)
    .strokeColor('#b8b8b9')
    .stroke();

  let y = tableTop + 30;
  doc.font('Helvetica').fontSize(10);

  if (type === 'order') {
    data.items.forEach(item => {
      doc
        .text(item.name, 50, y)
        .text(item.quantity.toString(), 280, y, { width: 90, align: 'right' })
        .text(`Rs. ${item.price.toFixed(2)}`, 370, y, { width: 90, align: 'right' })
        .text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 470, y, { width: 90, align: 'right' });
      y += 20;
    });
  } else {
    // booking
    doc
      .text(data.service.name, 50, y)
      .text('1', 280, y, { width: 90, align: 'right' })
      .text(`Rs. ${data.amount.toFixed(2)}`, 370, y, { width: 90, align: 'right' })
      .text(`Rs. ${data.amount.toFixed(2)}`, 470, y, { width: 90, align: 'right' });
    y += 20;
  }

  doc
    .moveTo(50, y + 10)
    .lineTo(560, y + 10)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .text('Total:', 370, y + 30, { width: 90, align: 'right' })
    .text(`Rs. ${(data.totalAmount || data.amount).toFixed(2)}`, 470, y + 30, { width: 90, align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(10)
    .text('Payment Mode:', 50, y + 30)
    .text(data.paymentMode.toUpperCase(), 150, y + 30);

  // Footer
  doc
    .fontSize(10)
    .fillColor('#b8b8b9')
    .text('Thank you for choosing Helper.', 50, 700, { align: 'center', width: 500 });

  doc.end();
});
