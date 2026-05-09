/**
 * Image Optimization Utilities
 * Responsive images, lazy loading, and WebP support
 */

// Get responsive image source set
export const getResponsiveImageSet = (imagePath, baseName) => {
  return {
    src: `${imagePath}/${baseName}.png`,
    srcSet: `
      ${imagePath}/${baseName}-sm.png 480w,
      ${imagePath}/${baseName}-md.png 768w,
      ${imagePath}/${baseName}-lg.png 1200w,
      ${imagePath}/${baseName}-xl.png 1920w
    `.trim()
  }
}

// Generate picture element with WebP support
export const generatePictureHTML = (imagePath, baseName, alt, sizes) => {
  return `
    <picture>
      <source 
        srcSet="${imagePath}/${baseName}.webp" 
        type="image/webp"
      >
      <source 
        srcSet="
          ${imagePath}/${baseName}-sm.png 480w,
          ${imagePath}/${baseName}-md.png 768w,
          ${imagePath}/${baseName}-lg.png 1200w,
          ${imagePath}/${baseName}-xl.png 1920w
        " 
        type="image/png"
      >
      <img 
        src="${imagePath}/${baseName}.png" 
        alt="${alt}"
        sizes="${sizes || '100vw'}"
        loading="lazy"
        decoding="async"
      >
    </picture>
  `.trim()
}

// Image compression recommendations
export const getImageOptimizationTips = () => ({
  tips: [
    'Convert PNG to WebP (25-35% smaller)',
    'Use AVIF format for modern browsers',
    'Implement responsive images with srcset',
    'Lazy load below-the-fold images',
    'Use CSS sprites for icons',
    'Compress with TinyPNG or ImageOptim',
    'Serve images from CDN',
    'Use next-gen formats with fallbacks'
  ]
})

// Check WebP support
export const supportsWebP = () => {
  const canvas = document.createElement('canvas')
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
}

// Generate thumbnail placeholder
export const generateBlurhash = (imageUrl) => {
  // Using CSS gradient as placeholder while loading
  return 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)'
}

// Image loading performance tracker
export const trackImagePerformance = (imagePath) => {
  const img = new Image()
  const startTime = performance.now()

  img.onload = () => {
    const endTime = performance.now()
    const loadTime = endTime - startTime
    console.log(`Image loaded: ${imagePath} in ${loadTime.toFixed(2)}ms`)
  }

  img.onerror = () => {
    console.error(`Failed to load image: ${imagePath}`)
  }

  img.src = imagePath
}

// Responsive image hook for React
export const useResponsiveImage = (imagePath, baseName, alt) => {
  return {
    src: `${imagePath}/${baseName}.png`,
    srcSet: `
      ${imagePath}/${baseName}-sm.png 480w,
      ${imagePath}/${baseName}-md.png 768w,
      ${imagePath}/${baseName}-lg.png 1200w
    `.trim(),
    alt,
    loading: 'lazy',
    decoding: 'async'
  }
}
