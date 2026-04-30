export default function Checkout() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-2xl mx-auto px-4">
        <div className="font-mono text-gray-400 text-sm mb-4">(Checkout)</div>
        <form className="bg-[#F6ECE4] rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <label className="block font-mono text-black mb-2">Full Name</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 font-mono" placeholder="Enter your name" />
          </div>
          <div>
            <label className="block font-mono text-black mb-2">Address</label>
            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-300 font-mono" placeholder="Enter your address" rows={3}></textarea>
          </div>
          <div>
            <label className="block font-mono text-black mb-2">Phone Number</label>
            <input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-300 font-mono" placeholder="Enter your phone number" />
          </div>
          <div>
            <label className="block font-mono text-black mb-2">Payment Method</label>
            <select className="w-full px-4 py-3 rounded-xl border border-gray-300 font-mono">
              <option>Razorpay</option>
              <option>Cash on Delivery</option>
            </select>
          </div>
          <button type="submit" className="w-full py-3 rounded-full border-2 border-[#18181A] font-mono text-[#18181A] hover:bg-[#18181A] hover:text-white transition text-lg font-bold mt-4">Place Order</button>
        </form>
      </div>
    </section>
  );
}
