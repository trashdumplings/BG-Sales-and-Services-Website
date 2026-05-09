/**
 * Scroll Utilities for Advanced Scroll Effects
 * Used in chilliquest.com and modern enterprise consulting sites
 */

/**
 * Smooth scroll to element by ID
 * @param {string} elementId - The ID of the element to scroll to
 * @param {number} offset - Optional offset from the top (default: 80px for navbar)
 */
export const scrollToElement = (elementId, offset = 80) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
};

/**
 * Scroll to top of page with smooth animation
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

/**
 * Check if element is in viewport
 * @param {HTMLElement} element
 * @param {number} offset - Pixels from edge to consider "in view"
 */
export const isElementInViewport = (element, offset = 0) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
};

/**
 * Get scroll position with easing
 * Used for parallax and scroll-linked animations
 */
export const getScrollProgress = (element) => {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const elementHeight = rect.height;

  // Calculate scroll progress (0 to 1)
  const scrollProgress = 1 - (rect.top + elementHeight) / (windowHeight + elementHeight);
  return Math.max(0, Math.min(1, scrollProgress));
};

/**
 * Create parallax effect with custom speed
 * @param {HTMLElement} element
 * @param {number} speed - Parallax speed multiplier (0.3 - 0.7 recommended)
 */
export const applyParallax = (element, speed = 0.5) => {
  if (!element) return;

  const handleScroll = () => {
    const scrollY = window.scrollY;
    const elementTop = element.offsetTop;
    const elementHeight = element.offsetHeight;
    const windowHeight = window.innerHeight;

    // Only apply parallax when element is in view
    if (elementTop - windowHeight < scrollY && scrollY < elementTop + elementHeight) {
      const distance = scrollY - elementTop;
      element.style.transform = `translateY(${distance * speed}px)`;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
};

/**
 * Animate counter from 0 to target value
 * @param {HTMLElement} element
 * @param {number} targetValue
 * @param {number} duration - Animation duration in milliseconds
 */
export const animateCounter = (element, targetValue, duration = 2000) => {
  let currentValue = 0;
  const startTime = Date.now();

  const update = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    currentValue = Math.floor(progress * targetValue);
    if (element) {
      element.textContent = currentValue.toLocaleString();
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };

  requestAnimationFrame(update);
};

/**
 * Add scroll event listener with passive option for performance
 * @param {Function} callback
 * @param {Object} options
 */
export const onScroll = (callback, options = { passive: true }) => {
  window.addEventListener('scroll', callback, options);
  return () => window.removeEventListener('scroll', callback);
};

/**
 * Throttle scroll events for performance
 * @param {Function} func
 * @param {number} limit - Minimum milliseconds between calls
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Debounce scroll events for performance
 * @param {Function} func
 * @param {number} wait - Milliseconds to wait
 */
export const debounce = (func, wait = 250) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
