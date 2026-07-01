import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper/85 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        {/* Subtle glow backdrop */}
        <div className="absolute h-28 w-28 rounded-full bg-[#6f5cff]/10 blur-2xl animate-pulse" />
        
        {/* Custom premium gradient spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-16 w-16 rounded-full border-[3px] border-transparent border-t-[#6f5cff] border-r-[#6f5cff]/20 border-b-[#6f5cff]/10"
          style={{ borderImageSlice: 1 }}
        />
        
        {/* Centered logo container */}
        <div className="absolute flex items-center justify-center">
          <img
            src="/HELPER LOGO 02.png"
            alt="Helper"
            className="h-6 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
      
      {/* Loading text with pulsing opacity */}
      <motion.p
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="mt-5 text-[11px] uppercase tracking-[0.22em] font-bold text-ink/70"
      >
        Loading experience
      </motion.p>
    </div>
  );
}
