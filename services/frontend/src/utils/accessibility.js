/**
 * Accessibility Utilities
 * WCAG AA+ compliance helpers
 */

// Generate unique IDs for aria-labelledby and aria-describedby
export const generateId = (prefix = 'id') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`

// Check if element is visible to screen readers
export const isScreenReaderVisible = (element) => {
  return element.offsetParent !== null
}

// Focus management for modals and dialogs
export const setFocusTrap = (containerElement, closeCallback) => {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyPress = (e) => {
    if (e.key === 'Escape' && closeCallback) {
      closeCallback()
      return
    }
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  containerElement.addEventListener('keydown', handleKeyPress)
  firstElement.focus()

  return () => containerElement.removeEventListener('keydown', handleKeyPress)
}

// Announce to screen readers
export const announceToScreenReaders = (message, priority = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement is made
  setTimeout(() => announcement.remove(), 1000)
}

// Skip to main content link
export const createSkipLink = (mainContentSelector = 'main') => {
  const skipLink = document.createElement('a')
  skipLink.href = `#${mainContentSelector}`
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'skip-link'
  skipLink.setAttribute('aria-label', 'Skip to main content')
  document.body.insertBefore(skipLink, document.body.firstChild)
}

// Add CSS for screen reader only text
export const addA11yStyles = () => {
  const style = document.createElement('style')
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 100;
    }

    .skip-link:focus {
      top: 0;
    }

    /* Focus visible for keyboard navigation */
    :focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    button:focus-visible,
    a:focus-visible,
    input:focus-visible {
      outline: 2px solid #2563eb;
      outline-offset: 2px;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* High contrast mode support */
    @media (prefers-contrast: more) {
      body {
        color: #000;
        background: #fff;
      }
    }

    /* Dark mode preference */
    @media (prefers-color-scheme: dark) {
      [data-theme] {
        color-scheme: dark;
      }
    }
  `
  document.head.appendChild(style)
}

// Validate color contrast ratio
export const getContrastRatio = (rgb1, rgb2) => {
  const getLuminance = (rgb) => {
    const [r, g, b] = rgb.match(/\\d+/g).map((x) => {
      x = parseInt(x) / 255
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const l1 = getLuminance(rgb1)
  const l2 = getLuminance(rgb2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}
