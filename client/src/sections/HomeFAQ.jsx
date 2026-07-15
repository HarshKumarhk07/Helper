import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FadeUp from '../components/ui/FadeUp.jsx';
import { getPublicFaqs } from '../api/faqs.js';

const DUMMY_FAQS = [
  {
    _id: '1',
    question: 'What types of spaces do you clean?',
    answer: 'We clean residential homes, apartments, offices, and commercial spaces. Our services are fully customizable to meet the specific needs of your space.',
  },
  {
    _id: '2',
    question: 'Are your cleaning products eco-friendly?',
    answer: 'Yes! We prioritize using safe, eco-friendly, and non-toxic cleaning products that are tough on dirt but safe for your family and pets.',
  },
  {
    _id: '3',
    question: 'How do I book a cleaning session?',
    answer: 'You can easily book a session through our website by selecting your required service, choosing a professional, and picking a convenient time slot.',
  },
  {
    _id: '4',
    question: 'Do I need to be home during the service?',
    answer: 'No, you do not need to be home. Many of our clients provide a spare key or access code. All our professionals are thoroughly background-checked for your peace of mind.',
  },
  {
    _id: '5',
    question: "What if I'm not satisfied with the service?",
    answer: 'Customer satisfaction is our priority. If you are not completely satisfied with our cleaning, let us know within 24 hours and we will re-clean the area at no extra cost.',
  }
];

// Decorative images that flank the FAQ column — swap these for your own.
const SIDE_IMAGE =
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=800';
const STACK_IMAGE_TOP =
  'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=800';
const STACK_IMAGE_BOTTOM =
  'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800';

export default function HomeFAQ() {
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    getPublicFaqs()
      .then((data) => {
        setFaqs(data && data.length > 0 ? data : DUMMY_FAQS);
      })
      .catch(() => {
        setFaqs(DUMMY_FAQS);
      });
  }, []);

  const toggleOpen = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="bg-paper pt-8 pb-16 md:pt-10 md:pb-20 overflow-hidden">
      <div className="container-velora">

        {/* Centered heading */}
        <FadeUp className="text-center mb-8 md:mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#13294B]/60 mb-3">
            Common Questions
          </p>
          <h2 className="font-sans text-3xl md:text-[2.75rem] leading-tight tracking-tight text-[#13294B] uppercase">
            <span className="font-medium">All You </span>
            <span className="font-extrabold">Need To Know</span>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* Left: single tall image */}
          <FadeUp className="hidden lg:block lg:col-span-3">
            <div className="w-full h-[560px] rounded-[2rem] overflow-hidden shadow-xl shadow-ink/5">
              <img
                src={SIDE_IMAGE}
                alt="Professional at work"
                className="w-full h-full object-cover"
              />
            </div>
          </FadeUp>

          {/* Center: FAQ accordion */}
          <FadeUp delay={0.1} className="lg:col-span-6">
            <div className="flex flex-col">
              {faqs.map((faq) => {
                const isOpen = openId === faq._id;

                return (
                  <div
                    key={faq._id}
                    className="border-b border-ink/10 first:border-t first:border-ink/10"
                  >
                    <button
                      onClick={() => toggleOpen(faq._id)}
                      className="w-full py-5 md:py-6 flex items-center justify-between text-left group"
                    >
                      <span className={`text-base md:text-lg font-semibold pr-8 transition-colors duration-200 ${
                        isOpen ? 'text-[#F5C518]' : 'text-[#13294B] group-hover:text-[#F5C518]'
                      }`}>
                        {faq.question}
                      </span>
                      <div className={`flex-shrink-0 transition-colors duration-200 ${
                        isOpen ? 'text-[#F5C518]' : 'text-[#13294B]/30 group-hover:text-[#F5C518]'
                      }`}>
                        {isOpen ? <Minus size={20} strokeWidth={2} /> : <Plus size={20} strokeWidth={2} />}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <p className="pb-6 text-sm md:text-[15px] text-[#13294B]/70 leading-relaxed pr-8">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </FadeUp>

          {/* Right: two stacked images */}
          <FadeUp delay={0.2} className="hidden lg:flex lg:col-span-3 flex-col gap-6">
            <div className="w-full h-[266px] rounded-[2rem] overflow-hidden shadow-xl shadow-ink/5">
              <img
                src={STACK_IMAGE_TOP}
                alt="Professional painting a wall"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-full h-[266px] rounded-[2rem] overflow-hidden shadow-xl shadow-ink/5">
              <img
                src={STACK_IMAGE_BOTTOM}
                alt="Professional painting a wall"
                className="w-full h-full object-cover"
              />
            </div>
          </FadeUp>

        </div>
      </div>
    </section>
  );
}
