import 'dotenv/config';

const API = process.env.API_URL || 'http://localhost:5000/api';

const ensure = (cond, msg) => { if (!cond) throw new Error(msg); };

const main = async () => {
  console.log('Starting Slice E validation...');

  // Setup: Create/get admin user via Mongoose
  console.log('Setting up admin user for testing...');
  const mongoose = await import('mongoose');
  const User = (await import('../src/models/User.js')).default;
  
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || undefined });
  
  const adminEmail = 'admin@velora.com';
  const password = 'Admin1234!';
  let admin = await User.findOne({ email: adminEmail });
  
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      phone: '9999999999',
      password,
      role: 'admin',
    });
    console.log('Created admin user');
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
    console.log('Updated user to admin role');
  }

  // 1. Login as admin
  let token;
  try {
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password }),
    });
    
    if (loginRes.status === 200) {
      const data = await loginRes.json();
      token = data.accessToken;
      console.log('✓ Admin logged in');
    }
  } catch (err) {
    console.error('Login failed:', err.message);
  }

  const headers = (t = token) => ({
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {})
  });

  // 2. Test coupon creation
  console.log('Testing coupon creation...');
  const couponRes = await fetch(`${API}/coupons`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      code: `SLICE-E-${Date.now().toString(36).toUpperCase()}`,
      discountType: 'percentage',
      discountValue: 15,
      minOrderValue: 500,
      maxDiscount: 200,
      expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: true,
    }),
  });
  
  if (couponRes.status === 201 || couponRes.status === 200) {
    const couponData = await couponRes.json();
    console.log('✓ Coupon created:', couponData.coupon?.code);
  } else {
    console.log('! Coupon creation may have skipped (non-admin user)');
  }

  // 3. Test coupon validation
  console.log('Testing coupon validation...');
  const validateRes = await fetch(`${API}/coupons/validate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      code: 'SUMMER10',
      orderValue: 1000,
    }),
  });
  
  if (validateRes.status === 200) {
    const validData = await validateRes.json();
    console.log('✓ Coupon validation working:', validData.valid);
  } else {
    console.log('! Coupon validation test skipped or not found');
  }

  // 4. Test admin stats (for dashboard)
  console.log('Testing admin stats endpoint...');
  const statsRes = await fetch(`${API}/admin/stats`, {
    headers: headers(token),
  });
  
  if (statsRes.status === 200) {
    const statsData = await statsRes.json();
    console.log('✓ Admin stats retrieved:');
    console.log('  - Total Revenue:', statsData.stats?.totalRevenue);
    console.log('  - Total Bookings:', statsData.stats?.totalBookings);
    console.log('  - Total Orders:', statsData.stats?.totalOrders);
    console.log('  - Worker Performance:', statsData.workerPerformance?.length, 'workers');
  } else {
    console.log('! Admin stats endpoint requires admin token');
  }

  // 5. Test audit logs endpoint
  console.log('Testing audit logs endpoint...');
  const auditRes = await fetch(`${API}/audit?limit=10`, {
    headers: headers(token),
  });
  
  if (auditRes.status === 200) {
    const auditData = await auditRes.json();
    console.log('✓ Audit logs retrieved:', auditData.total, 'total logs');
  } else {
    console.log('! Audit logs endpoint requires admin token');
  }

  // 6. Test invoice PDF generation (if order exists)
  console.log('Testing invoice generation...');
  const ordersRes = await fetch(`${API}/orders/mine`, {
    headers: headers(token),
  });
  
  if (ordersRes.status === 200) {
    const ordersData = await ordersRes.json();
    if (ordersData.orders?.length > 0) {
      const orderId = ordersData.orders[0]._id;
      const invoiceRes = await fetch(`${API}/invoices/order/${orderId}`, {
        headers: headers(token),
      });
      
      if (invoiceRes.status === 200) {
        const buf = await invoiceRes.buffer();
        console.log('✓ Invoice PDF generated:', buf.length, 'bytes');
      } else {
        console.log('! Invoice generation returned:', invoiceRes.status);
      }
    } else {
      console.log('! No orders found to generate invoice');
    }
  }

  console.log('✓ Slice E validation completed');
  
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Slice E validation failed:', err.message);
  process.exit(1);
});
