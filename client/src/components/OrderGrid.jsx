const orders = [
  {
    id: 'ORD-001',
    status: 'In Progress',
    service: 'Home Deep Cleaning',
    date: '2026-04-29',
    worker: 'Amit Sharma',
    amount: 1200,
  },
  {
    id: 'ORD-002',
    status: 'Completed',
    service: 'AC Repair',
    date: '2026-04-27',
    worker: 'Priya Singh',
    amount: 800,
  },
  {
    id: 'ORD-003',
    status: 'Placed',
    service: 'Plumbing',
    date: '2026-04-28',
    worker: 'Rahul Verma',
    amount: 650,
  },
];

const statusColors = {
  'Placed': 'bg-gray-200 text-gray-700',
  'In Progress': 'bg-yellow-200 text-yellow-800',
  'Completed': 'bg-green-200 text-green-800',
  'Cancelled': 'bg-red-200 text-red-800',
};

export default function OrderGrid() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="font-mono text-gray-400 text-sm mb-4">(Your Orders)</div>
        <div className="overflow-x-auto rounded-2xl shadow-lg">
          <table className="min-w-full bg-white font-mono">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left">Order ID</th>
                <th className="py-3 px-4 text-left">Service</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Worker</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-none">
                  <td className="py-3 px-4">{order.id}</td>
                  <td className="py-3 px-4">{order.service}</td>
                  <td className="py-3 px-4">{order.date}</td>
                  <td className="py-3 px-4">{order.worker}</td>
                  <td className="py-3 px-4">₹{order.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
