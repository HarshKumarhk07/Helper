import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper pt-20 pb-10">
      <div className="container-velora">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 md:gap-8 mb-16">
          
          {/* Brand Info */}
          <div>
            <Link to="/" className="mb-8 inline-block">
              {/* Ensure logo contrasts nicely or is visible; using original Helper Logo */}
              <img src="/HELPER LOGO 02.png" alt="Helper" className="h-12 w-auto object-contain max-w-[140px] bg-white/10 rounded px-2 py-1" />
            </Link>
            <p className="text-sm text-paper/70 leading-relaxed max-w-xs">
              Premium service, commerce, and workforce operations for modern homes. Designed with elegance, built for scale.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-paper/50 mb-6">SHOP</h4>
            <ul className="space-y-4 text-sm text-paper/80 font-medium">
              <li><Link to="/products" className="hover:text-brand transition-colors">All Products</Link></li>
              <li><Link to="/products" className="hover:text-brand transition-colors">Tools & Hardware</Link></li>
              <li><Link to="/products" className="hover:text-brand transition-colors">Electrical Supplies</Link></li>
              <li><Link to="/products" className="hover:text-brand transition-colors">Plumbing Supplies</Link></li>
              <li><Link to="/products" className="hover:text-brand transition-colors">Smart Home & Security</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-paper/50 mb-6">SERVICES</h4>
            <ul className="space-y-4 text-sm text-paper/80 font-medium">
              <li><Link to="/services" className="hover:text-brand transition-colors">All Services</Link></li>
              <li><Link to="/services" className="hover:text-brand transition-colors">Home Repair & Maintenance</Link></li>
              <li><Link to="/services" className="hover:text-brand transition-colors">Cleaning & Pest Control</Link></li>
              <li><Link to="/services" className="hover:text-brand transition-colors">Appliance Repair</Link></li>
              <li><Link to="/services" className="hover:text-brand transition-colors">Home Improvement</Link></li>
            </ul>
          </div>

          {/* Studio */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-paper/50 mb-6">STUDIO</h4>
            <ul className="space-y-4 text-sm text-paper/80 font-medium">
              <li><Link to="/join" className="hover:text-brand transition-colors">Our Philosophy</Link></li>
              <li><Link to="/me/support" className="hover:text-brand transition-colors">Help | Support</Link></li>
              <li><Link to="/me/support" className="hover:text-brand transition-colors">Contact Us</Link></li>
              <li><Link to="/favorites" className="hover:text-brand transition-colors">Saved Items</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-paper/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-paper/50">
          <div className="uppercase tracking-wider">
            © {year} HELPER — UNIFIED OPERATIONS
          </div>
          <div>
            Powered by advanced tracking | seamless booking.
          </div>
        </div>

      </div>
    </footer>
  );
}
