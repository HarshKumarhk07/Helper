import 'dotenv/config';

const main = async () => {
  // Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'arkbeasteditz@gmail.com',
      password: 'Password123' // Let's try this or another password. If login fails, let's sign up a new user!
    }),
  });

  let token;
  if (loginRes.status === 200) {
    const data = await loginRes.json();
    token = data.accessToken;
    console.log('Logged in successfully, token:', token);
  } else {
    console.log('Login failed with status:', loginRes.status);
    const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: `test_customer_${Date.now()}@example.com`,
        phone: '9999999999',
        password: 'Password123!',
      }),
    });
    if (signupRes.status === 201) {
      const data = await signupRes.json();
      token = data.accessToken;
      console.log('Signed up successfully, token:', token);
    } else {
      console.log('Signup failed with status:', signupRes.status);
      console.log(await signupRes.text());
      return;
    }
  }

  // Create Razorpay Order
  const createRpRes = await fetch('http://localhost:5000/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amount: 449,
      receipt: 'VH-TEST1234',
      type: 'booking'
    })
  });

  console.log('create-order status:', createRpRes.status);
  const resData = await createRpRes.json();
  console.log('create-order response:', JSON.stringify(resData, null, 2));
};

main().catch(console.error);
