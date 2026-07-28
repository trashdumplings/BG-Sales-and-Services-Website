import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const CounterStat = ({ value, label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observedNode = ref.current;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const duration = 2000;
        const startTime = Date.now();

        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setCount(Math.floor(progress * value));

          if (progress === 1) {
            clearInterval(interval);
          }
        }, 30);

        return () => clearInterval(interval);
      }
    }, { threshold: 0.5 });

    if (observedNode) {
      observer.observe(observedNode);
    }

    return () => {
      if (observedNode) observer.unobserve(observedNode);
    };
  }, [value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="bg-blue-100 rounded-2xl p-8 text-center"
    >
      <div className="text-5xl lg:text-6xl font-bold text-blue-600 mb-2">
        {count}+
      </div>
      <p className="text-gray-700 font-semibold text-lg">{label}</p>
    </motion.div>
  );
};

export default CounterStat;
