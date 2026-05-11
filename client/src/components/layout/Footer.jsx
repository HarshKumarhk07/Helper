export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink/5 bg-sand pt-20 pb-10 text-ink">
      <div className="container-velora grid gap-12 md:grid-cols-4 md:gap-8">
        
        <div className="col-span-1 md:col-span-1 pr-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-full bg-ink text-paper flex items-center justify-center font-serif text-lg">U</div>
            <div className="text-sm font-semibold tracking-[0.2em] uppercase">URBANEASE</div>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink/60 font-light">
            Premium service, commerce, and workforce operations for modern homes.
            Designed with elegance, built for scale.
          </p>
        </div>

        <div>
          <div className="mb-6 text-xs font-semibold uppercase tracking-widest text-ink">Shop</div>
          <ul className="space-y-4 text-sm text-ink/60 font-medium">
            <li className="hover:text-ink transition-colors cursor-pointer w-max">New Arrivals</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Bestsellers</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">The Lookbook</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Exclusive Offers</li>
          </ul>
        </div>

        <div>
          <div className="mb-6 text-xs font-semibold uppercase tracking-widest text-ink">Services</div>
          <ul className="space-y-4 text-sm text-ink/60 font-medium">
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Deep Cleaning</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Plumbing & Electrical</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Beauty & Spa</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Appliance Repair</li>
          </ul>
        </div>

        <div>
          <div className="mb-6 text-xs font-semibold uppercase tracking-widest text-ink">Studio</div>
          <ul className="space-y-4 text-sm text-ink/60 font-medium">
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Our Philosophy</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Careers</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Press & Media</li>
            <li className="hover:text-ink transition-colors cursor-pointer w-max">Contact Us</li>
          </ul>
        </div>

      </div>

      <div className="container-velora mt-20">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 md:flex-row">
          <span className="text-xs text-ink/50 font-medium uppercase tracking-widest">
            © {year} UrbanEase — Unified Operations
          </span>
          <span className="text-xs text-ink/40 font-medium tracking-wide">
            Powered by advanced tracking & seamless booking.
          </span>
        </div>
      </div>
    </footer>
  );
}
