const cartItems = [
  {
    id: 'P-001',
    name: 'Premium Cleaning Kit',
    price: 499,
    image: '/assets/cleaning-kit.jpg',
    quantity: 2,
  },
  {
    id: 'P-002',
    name: 'Orange t-shirt',
    price: 359,
    image: '/assets/orange-shirt.jpg',
    quantity: 1,
  },
];

export default function Cart() {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <div className="font-mono text-gray-400 text-sm mb-4">(Your Cart)</div>
        <div className="rounded-2xl shadow-lg overflow-hidden">
          <table className="min-w-full bg-white font-mono">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left">Product</th>
                <th className="py-3 px-4 text-left">Price</th>
                <th className="py-3 px-4 text-left">Quantity</th>
                <th className="py-3 px-4 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id} className="border-b last:border-none">
                  <td className="py-3 px-4 flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-xl" />
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3 px-4">₹{item.price}</td>
                  <td className="py-3 px-4">{item.quantity}</td>
                  <td className="py-3 px-4">₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end items-center p-6 bg-[#F6ECE4] font-mono text-lg font-bold">
            Grand Total: <span className="ml-4">₹{total}</span>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button className="px-8 py-3 rounded-full border-2 border-[#18181A] font-mono text-[#18181A] hover:bg-[#18181A] hover:text-white transition text-lg">Proceed to Checkout</button>
        </div>
      </div>
    </section>
  );
}
