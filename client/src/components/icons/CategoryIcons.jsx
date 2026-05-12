// Themed silhouette-style category icons.
// Each renders at currentColor so the parent tile's text-* class colors them.

const base = (props) => ({
  viewBox: '0 0 64 64',
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'currentColor',
  ...props,
});

// Women's Salon — Venus / female symbol (matches user reference)
export const WomenSalonIcon = (props) => (
  <svg {...base(props)}>
    <path
      d="M32 6a14 14 0 100 28 14 14 0 000-28zm0 6a8 8 0 110 16 8 8 0 010-16z"
    />
    <path d="M29 34h6v8h7v6h-7v8h-6v-8h-7v-6h7z" />
  </svg>
);

// Men's Salon — Mars / male symbol (matches user reference)
export const MenSalonIcon = (props) => (
  <svg {...base(props)}>
    {/* Circle (head of the symbol) */}
    <path d="M26 22a14 14 0 100 28 14 14 0 000-28zm0 6a8 8 0 110 16 8 8 0 010-16z" />
    {/* Arrow shaft going to upper-right */}
    <path d="M42 18l-9 9 4.5 4.5L46.5 22.5z" />
    {/* Arrow head */}
    <path d="M56 6H38v6h7.8L36 21.8 42.2 28 52 18.2V26h6V6z" />
  </svg>
);

// AC Repair — AC unit outline + wrench
export const AcRepairIcon = (props) => (
  <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="14" width="40" height="22" rx="3" />
    <path d="M14 22h8M14 28h6" />
    <path d="M14 42c0 4-3 4-3 8M22 42c0 4-3 4-3 8M30 42c0 4-3 4-3 8" />
    {/* Wrench overlay */}
    <path
      d="M48 32a6 6 0 016 6c0 1 0 2-1 3l5 5a3 3 0 01-4 4l-5-5c-1 1-2 1-3 1a6 6 0 01-6-6 6 6 0 011-3l3 3 2-2-3-3c1-1 2-2 3-2z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

// Cleaning — bucket with broom sticking up
export const CleaningIcon = (props) => (
  <svg {...base(props)}>
    {/* Broom handle */}
    <rect x="42" y="6" width="4" height="30" rx="2" />
    {/* Broom bristles */}
    <path d="M34 32h20l-2 12H36z" />
    <path d="M38 36v8M42 36v8M46 36v8M50 36v8" stroke="white" strokeWidth="1.5" opacity="0.6" />
    {/* Bucket */}
    <path d="M10 38h28l-3 18a3 3 0 01-3 3H16a3 3 0 01-3-3z" />
    <ellipse cx="24" cy="38" rx="14" ry="3" fill="white" opacity="0.25" />
    {/* Bucket handle */}
    <path
      d="M14 38c0-6 5-10 10-10s10 4 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

// Home Repair — house outline with wrench badge
export const HomeRepairIcon = (props) => (
  <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 30L32 10l24 20" />
    <path d="M14 28v22a2 2 0 002 2h32a2 2 0 002-2V28" />
    <path d="M26 52V38h12v14" />
    {/* Wrench badge bottom-right */}
    <circle cx="46" cy="46" r="9" fill="white" stroke="currentColor" />
    <path
      d="M50 42a3 3 0 11-2 5l-3 3a1.5 1.5 0 01-2-2l3-3a3 3 0 014-3z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

// Painting — paint brush at an angle
export const PaintingIcon = (props) => (
  <svg {...base(props)}>
    {/* Brush head (rectangle with stroke pattern) */}
    <path
      d="M38 8l18 18-8 8-18-18z"
      transform="rotate(0)"
    />
    {/* Ferrule (metal band) */}
    <path d="M32 16l16 16-3 3-16-16z" fill="white" opacity="0.35" />
    {/* Handle */}
    <path
      d="M28 22l14 14-12 12a5 5 0 01-7 0l-7-7a5 5 0 010-7z"
    />
    {/* Tip dab */}
    <circle cx="14" cy="50" r="3" opacity="0.6" />
  </svg>
);

// Water Purifier — water drop (untouched per request)
export const WaterPurifierIcon = (props) => (
  <svg {...base(props)}>
    <path d="M32 6c-1 0-2 0-3 2-5 7-13 18-13 27a16 16 0 0032 0c0-9-8-20-13-27-1-2-2-2-3-2z" />
    <path
      d="M24 30c-2 4-3 8-3 11a11 11 0 0011 11"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
  </svg>
);

// Electrician — hard hat + lightning bolt
export const ElectricianIcon = (props) => (
  <svg {...base(props)}>
    {/* Hard hat dome */}
    <path d="M14 38c0-10 8-18 18-18s18 8 18 18z" />
    {/* Brim */}
    <rect x="10" y="38" width="44" height="6" rx="2" />
    {/* Crest strip */}
    <rect x="30" y="22" width="4" height="16" fill="white" opacity="0.4" />
    {/* Lightning bolt overlay */}
    <path
      d="M34 46l-8 10h6l-2 8 8-10h-6z"
      fill="currentColor"
    />
  </svg>
);

export const CATEGORY_ICONS = {
  womenSalon: WomenSalonIcon,
  menSalon: MenSalonIcon,
  acRepair: AcRepairIcon,
  cleaning: CleaningIcon,
  homeRepair: HomeRepairIcon,
  painting: PaintingIcon,
  waterPurifier: WaterPurifierIcon,
  electrician: ElectricianIcon,
};
