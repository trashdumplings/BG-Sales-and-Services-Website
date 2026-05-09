/**
 * Performance Monitoring & Optimization Utilities
 * Tracks Core Web Vitals and provides performance insights
 */

// Lazy load images with Intersection Observer
export const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]')
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        img.removeAttribute('data-src')
        imageObserver.unobserve(img)
      }
    })
  })
  images.forEach((img) => imageObserver.observe(img))
}

// Debounce utility for resize/scroll events
export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Throttle utility for performance-critical events
export const throttle = (func, limit) => {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Resource prefetching for critical pages
export const prefetchResource = (href, as = 'script') => {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = as
  link.href = href
  document.head.appendChild(link)
}

// Preload critical resources
export const preloadResource = (href, as = 'script', type = '') => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = as
  link.href = href
  if (type) link.type = type
  document.head.appendChild(link)
}

// Monitor Core Web Vitals using PerformanceObserver
export const monitorWebVitals = () => {
  if ('PerformanceObserver' in window) {
    try {
      // CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            console.log('CLS:', entry.value)
          }
        }
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('FCP:', entry.startTime)
        }
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
    } catch (e) {
      console.warn('Web Vitals monitoring not supported')
    }
  }
}

// Request idle callback polyfill
export const requestIdleCallback = (callback, options) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }
  const start = Date.now()
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    })
  }, 1)
}

// Check connection speed
export const getConnectionSpeed = () => {
  if ('connection' in navigator) {
    return navigator.connection.effectiveType
  }
  return '4g'
}

// Adaptive loading based on network
export const shouldLoadHighQuality = () => {
  const speed = getConnectionSpeed()
  return speed === '4g'
}
