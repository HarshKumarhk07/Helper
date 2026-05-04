import 'dotenv/config';
import crypto from 'crypto';

const API = process.env.API_URL || 'http://localhost:5000/api';

const rnd = (n = 6) => Math.random().toString(36).slice(2, 2 + n);

const headers = (token) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });

const ensure = (cond, msg) => { if (!cond) throw new Error(msg); };

const main = async () => {
  console.log('Starting Slice D E2E simulation...');

  // 1. Pick a product
  const prodRes = await fetch(`${API}/products`);
  const prodJson = await prodRes.json();
  const products = prodJson.products || [];
  if (!Array.isArray(products) || products.length === 0) {
    console.log('No products found — creating a test product directly in the database');
    // create a product directly via mongoose
    const mongoose = await import('mongoose');
    const Product = (await import('../src/models/Product.js')).default;
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || undefined });
    const created = await Product.create({ name: `E2E Product ${rnd(4)}`, slug: `e2e-${rnd(6)}`, description: 'E2E test product', price: 199, stock: 10, isActive: true, category: 'test' });
    await mongoose.disconnect();
    console.log('Created product:', created._id);
    // refetch
    const prodRes2 = await fetch(`${API}/products`);
    const prodJson2 = await prodRes2.json();
    const products2 = prodJson2.products || [];
    ensure(Array.isArray(products2) && products2.length > 0, 'Failed to create product');
    var product = products2[0];
  } else {
    var product = products[0];
  }
  console.log('Using product:', product._id, product.name || product.slug);

  // 2. Signup a new user
  const email = `e2e_${rnd(5)}@example.com`;
  const password = 'Test1234!';
  const signupRes = await fetch(`${API}/auth/signup`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ name: 'E2E Tester', email, phone: '9999999999', password })
  });
  const signupJson = await signupRes.json();
  ensure(signupRes.status === 201, `Signup failed: ${JSON.stringify(signupJson)}`);
  const token = signupJson.accessToken;
  console.log('Signed up user:', email);

  // 3. Create order (online)
  const orderPayload = {
    items: [{ product: product._id, quantity: 1 }],
    paymentMode: 'online',
    address: { line1: 'Test', city: 'Test', state: 'TS', pincode: '000000' }
  };
  const createOrderRes = await fetch(`${API}/orders`, { method: 'POST', headers: headers(token), body: JSON.stringify(orderPayload) });
  const createOrderJson = await createOrderRes.json();
  ensure(createOrderRes.status === 201, `Create order failed: ${JSON.stringify(createOrderJson)}`);
  const order = createOrderJson.order;
  console.log('Order created:', order._id, 'total', order.totalAmount);

  // 4. Create Razorpay order via API
  const createRpRes = await fetch(`${API}/payments/create-order`, { method: 'POST', headers: headers(token), body: JSON.stringify({ amount: order.totalAmount, receipt: order.orderId, type: 'ecommerce' }) });
  const createRpJson = await createRpRes.json();
  ensure(createRpRes.status === 200, `Create Razorpay order failed: ${JSON.stringify(createRpJson)}`);
  const rpOrder = createRpJson.razorpayOrder;
  console.log('Razorpay order created:', rpOrder.id);

  // 5. Simulate payment: create fake payment id and compute expected signature
  const fakePaymentId = `pay_${rnd(8)}`;
  const body = rpOrder.id + '|' + fakePaymentId;
  const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(body).digest('hex');

  // 6. Verify payment via API
  const verifyRes = await fetch(`${API}/payments/verify`, {
    method: 'POST', headers: headers(token), body: JSON.stringify({ razorpay_order_id: rpOrder.id, razorpay_payment_id: fakePaymentId, razorpay_signature: expectedSig, referenceId: order._id, type: 'ecommerce' })
  });
  const verifyJson = await verifyRes.json();
  ensure(verifyRes.status === 200, `Verify payment failed: ${JSON.stringify(verifyJson)}`);
  console.log('Payment verified:', verifyJson.message || verifyJson);

  // 7. Fetch order and assert paymentStatus
  const getOrderRes = await fetch(`${API}/orders/${order._id}`, { headers: headers(token) });
  const getOrderJson = await getOrderRes.json();
  ensure(getOrderRes.status === 200, `Get order failed: ${JSON.stringify(getOrderJson)}`);
  ensure(getOrderJson.order.paymentStatus === 'paid', `Order paymentStatus not paid: ${getOrderJson.order.paymentStatus}`);
  console.log('Order paymentStatus is paid — E2E simulation passed');
};

main().catch((err) => { console.error('E2E simulation failed:', err); process.exit(2); });
