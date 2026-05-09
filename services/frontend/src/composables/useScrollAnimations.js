import { useEffect, useRef, useState } from 'react';

/**
 * useScrollReveal Hook
 * Triggers animations when element comes into view with smooth cubic-bezier easing
 */
export const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && ref.current) {
          ref.current.style.opacity = '1';
          ref.current.style.transform = 'translateY(0)';
          ref.current.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
      });
    }, { ...defaultOptions, ...options });

    if (ref.current) {
      ref.current.style.opacity = '0';
      ref.current.style.transform = 'translateY(30px)';
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [options]);

  return ref;
};

/**
 * useScrollParallax Hook
 * Creates parallax effect on scroll for depth perception
 */
export const useScrollParallax = (speed = 0.5) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const scrollY = window.scrollY;
        const elementTop = ref.current.offsetTop;
        const elementHeight = ref.current.offsetHeight;
        const windowHeight = window.innerHeight;

        // Only apply parallax when element is in view
        if (elementTop - windowHeight < scrollY && scrollY < elementTop + elementHeight) {
          const distance = scrollY - elementTop;
          ref.current.style.transform = `translateY(${distance * speed}px)`;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return ref;
};

/**
 * useScrollCounter Hook
 * Animates counting up from 0 to a target number when element enters view
 */
export const useScrollCounter = (targetValue, duration = 2) => {
  const ref = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const startTime = Date.now();
          const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            setCount(Math.floor(progress * targetValue));

            if (progress === 1) {
              clearInterval(interval);
            }
          }, 16);

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [targetValue, duration]);

  return [ref, count];
};

export default useScrollReveal;
