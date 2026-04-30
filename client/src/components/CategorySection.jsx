const categories = [
  { name: 'NEW IN', count: 87 },
  { name: 'MEN', count: 96 },
  { name: 'WOMEN', count: 174 },
  { name: 'LOOKBOOK', count: 21 },
  { name: 'ACCESSORIES', count: 58 },
  { name: 'FOOTWEAR', count: 72 },
];

export default function CategorySection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
          <div>
            <div className="font-mono text-gray-400 text-sm mb-2">(Categories)</div>
            <div className="flex flex-col md:flex-row md:gap-8 gap-2">
              {categories.map((cat) => (
                <div key={cat.name} className={`text-4xl md:text-6xl font-bold font-mono ${cat.name === 'WOMEN' ? 'text-black' : 'text-gray-400'} leading-none`}>{cat.name}
                  <span className="align-super text-xs font-normal ml-1">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
          <a href="#" className="font-mono text-black underline text-sm mt-6 md:mt-0">View all products ↗</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl overflow-hidden bg-[#F6ECE4] flex flex-col items-center p-6">
            <img src="/assets/green-shirt.jpg" alt="Oversize green t-shirt" className="w-48 h-56 object-cover rounded-xl mb-4" />
            <div className="font-mono text-black text-sm mb-1">Oversize green t-Shirt<br />One size</div>
            <div className="font-mono text-gray-400 text-xs">$12.50</div>
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#F6ECE4] flex flex-col items-center p-6">
            <img src="/assets/orange-shirt.jpg" alt="Orange t-shirt" className="w-48 h-56 object-cover rounded-xl mb-4" />
            <div className="font-mono text-black text-sm mb-1">Orange t-shirt<br />S / M / L / XL</div>
            <div className="font-mono text-gray-400 text-xs">$35.90</div>
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#F6ECE4] flex flex-col items-center p-6">
            <img src="/assets/blue-shirt.jpg" alt="Blue t-shirt" className="w-48 h-56 object-cover rounded-xl mb-4" />
            <div className="font-mono text-black text-sm mb-1">Blue t-shirt<br />S / M / L / XL</div>
            <div className="font-mono text-gray-400 text-xs">$45.00</div>
          </div>
        </div>
      </div>
    </section>
  );
}
