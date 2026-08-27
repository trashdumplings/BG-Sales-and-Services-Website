/**
 * Security & Data Validation Utilities
 * Input sanitization, XSS prevention, data encryption helpers
 */

// Sanitize HTML to prevent XSS attacks
export const sanitizeHTML = (dirtyHTML) => {
  const div = document.createElement('div')
  div.textContent = dirtyHTML
  return div.innerHTML
}

// Sanitize user input
export const sanitizeInput = (input) => {
  const tempDiv = document.createElement('div')
  tempDiv.textContent = input
  return tempDiv.innerHTML
}

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number
export const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Validate URL format
export const isValidURL = (url) => {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

// Escape special characters
export const escapeSpecialChars = (str) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return str.replace(/[&<>"']/g, (char) => map[char])
}

// Generate secure token
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Check for suspicious input patterns
export const isSuspiciousInput = (input) => {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi
  ]

  return suspiciousPatterns.some((pattern) => pattern.test(input))
}

// Rate limiting helper
export const createRateLimiter = (maxAttempts = 5, windowMs = 60000) => {
  const attempts = {}

  return {
    isLimited: (key) => {
      const now = Date.now()
      if (!attempts[key]) {
        attempts[key] = []
      }

      // Remove old attempts
      attempts[key] = attempts[key].filter((time) => now - time < windowMs)

      if (attempts[key].length >= maxAttempts) {
        return true
      }

      attempts[key].push(now)
      return false
    },

    reset: (key) => {
      delete attempts[key]
    }
  }
}

// CSRF token management
export const CSRFTokenManager = {
  generate: () => {
    const token = generateSecureToken()
    sessionStorage.setItem('csrf-token', token)
    return token
  },

  get: () => {
    return sessionStorage.getItem('csrf-token')
  },

  validate: (token) => {
    return token === sessionStorage.getItem('csrf-token')
  }
}

// Content Security Policy check
export const initCSP = () => {
  const meta = document.createElement('meta')
  meta.httpEquiv = 'Content-Security-Policy'
  meta.content = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://api.web3forms.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self'
  `.replace(/\s+/g, ' ')
  document.head.appendChild(meta)
}
