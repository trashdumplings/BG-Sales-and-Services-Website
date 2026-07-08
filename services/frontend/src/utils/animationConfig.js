/**
 * Advanced Animation Patterns Used in Enterprise Consulting Sites
 * Similar to: chilliquest.com, and modern Framer Motion best practices
 */

/**
 * CUBIC-BEZIER EASING CURVES
 * These provide smooth, professional landing animations
 */
export const easingCurves = {
  // Default smooth easing (used in most animations)
  smooth: [0.34, 1.56, 0.64, 1],
  
  // Gentle ease-out (subtler movement)
  gentle: [0.25, 0.46, 0.45, 0.94],
  
  // Snappy ease (quick and responsive)
  snappy: [0.43, 0.13, 0.15, 0.96],
  
  // Bouncy ease (playful entrance)
  bouncy: [0.68, -0.55, 0.265, 1.55],
  
  // Elastic ease (professional entrance)
  elastic: [0.175, 0.885, 0.32, 1.275],
};

/**
 * STAGGER ANIMATION PATTERNS
 * Used for lists, grids, and sequential element reveals
 */
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.25,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

/**
 * PARALLAX EFFECT CONFIGURATION
 * Creates depth perception as user scrolls
 */
export const parallaxConfig = {
  speed: 0.5, // Adjust between 0.3 - 0.7 for different effect strengths
};

/**
 * SCROLL REVEAL CONFIGURATION
 * Controls when elements animate into view
 */
export const scrollRevealConfig = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px',
};

/**
 * VIEWPORT TRIGGERS
 * Used with Framer Motion's whileInView prop
 */
export const viewportConfig = {
  once: true,
  amount: 0.3,
};

/**
 * FADE & SLIDE ANIMATION
 * Classic entrance animation for sections
 */
export const fadeSlideVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

/**
 * SCALE & FADE ANIMATION
 * Used for cards, buttons, stat counters
 */
export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

/**
 * BUTTON ANIMATION PATTERN
 * Creates interactive feedback on click
 */
export const buttonVariants = {
  rest: { scale: 1 },
  tap: { scale: 0.97 },
};

/**
 * NAVBAR ANIMATION
 * Smooth background transition on scroll
 */
export const navbarVariants = {
  hidden: { y: -100 },
  visible: {
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  scrolled: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * HERO SECTION ANIMATION
 * Large, impactful entrance for hero headlines
 */
export const heroHeadlineVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.34, 1.56, 0.64, 1],
      delay: 0.2,
    },
  },
};

export const heroSubheadlineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
      delay: 0.4,
    },
  },
};

/**
 * HERO IMAGE ANIMATION
 * Subtle scale and fade for images
 */
export const heroImageVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1,
      ease: 'easeOut',
      delay: 0.3,
    },
  },
};

/**
 * FEATURE LIST ANIMATION
 * Staggered bullet points or feature items
 */
export const featureListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const featureItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

/**
 * COUNTER ANIMATION
 * Used for stat cards (Years, Projects, etc.)
 */
export const counterVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

/**
 * TEXT GRADIENT ANIMATION
 * Smooth reveal of gradient text
 */
export const gradientTextVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

/**
 * SECTION DIVIDER ANIMATION
 * Smooth entrance for section separators
 */
export const dividerVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      delay: 0.4,
    },
  },
};
