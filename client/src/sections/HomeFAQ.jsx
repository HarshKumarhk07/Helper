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
    <section className="bg-paper py-20 md:py-32 overflow-hidden relative">
      <div className="container-velora relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side: Large Image */}
          <FadeUp className="hidden lg:block h-full">
            <div className="w-full h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-ink/5">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=1200" 
                alt="Cleaning professional" 
                className="w-full h-full object-cover"
              />
            </div>
          </FadeUp>

          {/* Right Side: Accordion Box */}
          <FadeUp delay={0.1} className="relative z-20">
            {/* On desktop, we pull it slightly to the left over the image */}
            <div className="bg-[#13294B] text-paper rounded-[2.5rem] p-8 md:p-12 lg:-ml-16 shadow-[0_25px_60px_-15px_rgba(19,41,75,0.4)] border border-white/10">
              
              {/* FAQ Section Accent Badges */}
              <div className="mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5C518]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Common Questions
                </span>
              </div>

              <h2 className="font-sans text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-8 text-white uppercase">
                ALL YOU NEED TO KNOW
              </h2>

              <div className="flex flex-col gap-1">
                {faqs.map((faq) => {
                  const isOpen = openId === faq._id;
                  
                  return (
                    <div 
                      key={faq._id} 
                      className="border-b border-white/10 last:border-b-0 py-1"
                    >
                      <button
                        onClick={() => toggleOpen(faq._id)}
                        className="w-full py-4.5 flex items-center justify-between text-left group"
                      >
                        <span className={`text-[15px] md:text-base font-semibold pr-8 transition-colors duration-200 ${
                          isOpen ? 'text-[#F5C518]' : 'text-white/95 group-hover:text-[#FBBF24]'
                        }`}>
                          {faq.question}
                        </span>
                        <div className={`flex-shrink-0 transition-colors duration-200 ${
                          isOpen ? 'text-[#F5C518]' : 'text-white/40 group-hover:text-[#FBBF24]'
                        }`}>
                          {isOpen ? <Minus size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
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
                            <p className="pb-5 text-sm md:text-[15px] text-white/80 leading-relaxed pr-8">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

            </div>
          </FadeUp>

        </div>
      </div>
    </section>
  );
}
