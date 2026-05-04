import assert from 'node:assert/strict';
import { computeDiscountAmount, applyOrderStatusTimestamps, recordOrderHistory } from '../src/utils/ecommerce.js';

const percentageCoupon = { discountType: 'percentage', discountValue: 10, maxDiscount: 120 };
const fixedCoupon = { discountType: 'fixed', discountValue: 250 };

assert.equal(computeDiscountAmount({ subtotal: 1000, coupon: percentageCoupon }), 100);
assert.equal(computeDiscountAmount({ subtotal: 5000, coupon: percentageCoupon }), 120);
assert.equal(computeDiscountAmount({ subtotal: 1000, coupon: fixedCoupon }), 250);

const order = { history: [], placedAt: new Date('2026-05-02T10:00:00Z') };
recordOrderHistory(order, 'placed', 'processing', 'admin-id', 'Packed and ready');
applyOrderStatusTimestamps(order, 'processing');
applyOrderStatusTimestamps(order, 'shipped');
applyOrderStatusTimestamps(order, 'delivered');

assert.equal(order.history.length, 1);
assert.equal(order.history[0].to, 'processing');
assert.ok(order.processingAt instanceof Date);
assert.ok(order.shippedAt instanceof Date);
assert.ok(order.deliveredAt instanceof Date);

console.log('Slice D ecommerce validation passed');