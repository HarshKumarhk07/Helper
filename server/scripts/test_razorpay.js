import 'dotenv/config';
import Razorpay from 'razorpay';

const main = async () => {
  console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount: 44900,
    currency: 'INR',
    receipt: 'VH-0Y73KMCIO',
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log('Order created successfully:', order);
  } catch (error) {
    console.error('Error creating order:', error);
  }
};

main();
