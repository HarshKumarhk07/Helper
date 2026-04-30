import { motion } from 'framer-motion';

export default function FadeUp({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const Component = motion[Tag] || motion.div;
  return (
    <Component
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </Component>
  );
}
