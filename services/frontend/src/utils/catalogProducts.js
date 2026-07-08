const categoryLabels = {
  laptop: 'Laptops',
  desktop: 'Desktops',
  printer: 'Printers',
  networking: 'Networking',
  audiovisual: 'Audio Visual',
  power: 'Power & UPS',
  accessories: 'Accessories',
}

export const getCategoryLabel = (category = '') =>
  categoryLabels[category] || category.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export const normalizeCatalogProduct = (product, fallbackProducts = []) => {
  const fallbackImage = fallbackProducts.find((item) => item.category === product.category)?.image
    || fallbackProducts[0]?.image

  return {
    ...product,
    image: product.image_url || product.image || fallbackImage,
    previousPrice: product.previous_price ?? product.previousPrice ?? null,
    shortDescription: product.short_description || product.shortDescription || product.description,
    categoryLabel: product.category_label || product.categoryLabel || getCategoryLabel(product.category),
    specs: Array.isArray(product.specs) ? product.specs : [],
  }
}

export const mergeCatalogProducts = (managedProducts = [], bundledProducts = []) => {
  const normalizedManaged = managedProducts.map((product) =>
    normalizeCatalogProduct(product, bundledProducts),
  )
  const managedSlugs = new Set(normalizedManaged.map((product) => product.slug))
  return [
    ...normalizedManaged,
    ...bundledProducts.filter((product) => !managedSlugs.has(product.slug)),
  ]
}
