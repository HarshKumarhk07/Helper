export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ink/10 bg-sand py-10 dark:border-paper/10 dark:bg-[#0E0E10]">
      <div className="container-velora grid gap-8 md:grid-cols-4">
        <div>
          <div className="text-base font-semibold tracking-[0.2em]">VELORA HOUSE</div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink/70 dark:text-paper/60">
            Urban service & heritage commerce. Designed in the city, made for everywhere.
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs uppercase tracking-widest text-ink/60">Shop</div>
          <ul className="space-y-2 text-sm">
            <li>Men</li>
            <li>Women</li>
            <li>Lookbook</li>
            <li>Sale</li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs uppercase tracking-widest text-ink/60">Services</div>
          <ul className="space-y-2 text-sm">
            <li>Cleaning</li>
            <li>Plumbing</li>
            <li>Electrical</li>
            <li>Beauty & Spa</li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs uppercase tracking-widest text-ink/60">Studio</div>
          <ul className="space-y-2 text-sm">
            <li>Philosophy</li>
            <li>Careers</li>
            <li>Press</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="container-velora mt-10 flex flex-col items-center justify-between gap-2 border-t border-ink/10 pt-6 text-xs text-ink/60 md:flex-row dark:border-paper/10 dark:text-paper/50">
        <span>© {year} Velora House — All rights reserved</span>
        <span>Crafted with care · v0.1</span>
      </div>
    </footer>
  );
}
