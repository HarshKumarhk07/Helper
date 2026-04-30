export default function PhilosophySection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="font-mono text-gray-400 text-sm mb-4">(Philosophy)</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="font-mono text-gray-400 text-xs mb-2">Timeless Style, Modern Spirit</div>
            <div className="font-mono text-black text-lg mb-6">
              At Velora House, every collection blends refined silhouettes with contemporary accents, offering clothing that feels elevated, versatile, and effortlessly stylish.
            </div>
            <div className="font-mono text-gray-400 text-xs mb-2">Responsibly Crafted Pieces</div>
            <div className="font-mono text-black text-base mb-6">
              We place sustainability at the heart of our production. From eco-conscious fabrics to ethical manufacturing partners, each garment is created with care for both people and the planet.
            </div>
            <div className="font-mono text-gray-400 text-xs mb-2">Inspired by Global Aesthetics</div>
            <div className="font-mono text-black text-base">
              Our design team draws from art, culture, and modern design movements, shaping collections that feel fresh while remaining rooted in timeless elegance.
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img src="/assets/philosophy-image.jpg" alt="Philosophy" className="w-64 h-64 object-cover rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
