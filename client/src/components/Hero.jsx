export default function Hero() {
  return (
    <section className="w-full bg-[#F6ECE4] py-20 flex flex-col items-center">
      <h1 className="text-5xl md:text-7xl font-bold font-mono text-[#18181A] mb-8 text-center">
        THE URBAN HERITAGE COLLECTION
      </h1>
      <div className="flex gap-4 mb-8">
        <button className="px-6 py-2 rounded-full border-2 border-[#18181A] font-mono text-[#18181A] hover:bg-[#18181A] hover:text-white transition">
          Modern Icons
        </button>
        <button className="px-6 py-2 rounded-full border-2 border-[#18181A] font-mono text-[#18181A] hover:bg-[#18181A] hover:text-white transition">
          New Silhouettes
        </button>
      </div>
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-lg">
        <img src="/assets/hero-jacket.jpg" alt="Urban Heritage Jacket" className="w-full h-96 object-cover" />
        <div className="absolute bottom-6 left-6 bg-[#18181A] bg-opacity-90 text-white p-6 rounded-xl font-mono text-base max-w-[80%]">
          <div className="mb-2">At Urban Heritage, we design with intention — blending classic European tailoring with bold architectural lines. Each piece tells a story of refinement, versatility, and individuality, crafted for those who move effortlessly between tradition and innovation.</div>
          <a href="#" className="underline font-bold flex items-center gap-1">Explore the Collection <span>↗</span></a>
        </div>
      </div>
    </section>
  );
}
