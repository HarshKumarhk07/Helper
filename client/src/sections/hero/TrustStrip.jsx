import { Star, Users, ShieldCheck, Headphones, Zap, ShieldAlert } from 'lucide-react';

const C = {
  blue: '#13294B',
  dark: '#FFFFFF',
  gray: 'rgba(255, 255, 255, 0.6)',
  green: '#16A34A',
  star: '#FACC15',
  orange: '#F59E0B',
  border: '#E5E7EB',
};

const ITEMS = [
  { icon: Star,        value: '4.9',        label: 'Average Rating',   color: C.star },
  { icon: Users,       value: '10,000+',    label: 'Happy Customers',  color: C.blue },
  { icon: ShieldCheck, value: 'Verified',   label: 'Professionals',    color: C.green },
  { icon: Headphones,  value: '24/7',       label: 'Customer Support', color: C.blue },
  { icon: Zap,         value: 'Same Day',   label: 'Booking',          color: C.orange,  desktopOnly: true },
  { icon: ShieldAlert, value: 'Money Back', label: 'Guarantee',        color: C.blue,    desktopOnly: true },
];

export default function TrustStrip() {
  return (
    <div className="grid grid-cols-2 gap-4 pt-8 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-center lg:gap-x-6 lg:gap-y-4 lg:pt-10">
      {ITEMS.map((item) => (
        <div
          key={item.value}
          className={`flex items-center gap-2.5 ${item.desktopOnly ? 'hidden lg:flex' : ''}`}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
            style={{ border: `1px solid ${C.border}` }}
          >
            <item.icon size={16} strokeWidth={2} style={{ color: item.color }} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold" style={{ color: C.dark }}>{item.value}</div>
            <div className="text-xs" style={{ color: C.gray }}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
