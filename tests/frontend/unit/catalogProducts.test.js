import { describe, expect, it } from 'vitest'
import {
  getCategoryLabel,
  normalizeCatalogProduct,
  mergeCatalogProducts,
} from '@/utils/catalogProducts'

describe('getCategoryLabel', () => {
  it('resolves known categories to their friendly label', () => {
    expect(getCategoryLabel('laptop')).toBe('Laptops')
    expect(getCategoryLabel('audiovisual')).toBe('Audio Visual')
  })

  it('titleizes unknown slugs', () => {
    expect(getCategoryLabel('smart-home')).toBe('Smart Home')
    expect(getCategoryLabel('power_backup')).toBe('Power Backup')
  })

  it('handles an empty category gracefully', () => {
    expect(getCategoryLabel('')).toBe('')
    expect(getCategoryLabel()).toBe('')
  })
})

describe('normalizeCatalogProduct', () => {
  it('maps backend snake_case fields onto camelCase UI fields', () => {
    const product = {
      slug: 'router-1',
      category: 'networking',
      image_url: 'https://cdn.example.com/router.jpg',
      previous_price: 5000,
      short_description: 'Fast and reliable',
      in_stock: true,
      specs: ['Wifi 6', 'Dual band'],
    }
    const normalized = normalizeCatalogProduct(product)
    expect(normalized.image).toBe('https://cdn.example.com/router.jpg')
    expect(normalized.previousPrice).toBe(5000)
    expect(normalized.shortDescription).toBe('Fast and reliable')
    expect(normalized.inStock).toBe(true)
    expect(normalized.categoryLabel).toBe('Networking')
    expect(normalized.specs).toEqual(['Wifi 6', 'Dual band'])
  })

  it('falls back to a same-category fallback product image when image_url is missing', () => {
    const product = { slug: 'no-image', category: 'laptop' }
    const fallback = [{ category: 'laptop', image: 'laptop-fallback.jpg' }]
    const normalized = normalizeCatalogProduct(product, fallback)
    expect(normalized.image).toBe('laptop-fallback.jpg')
  })

  it('falls back to the first fallback product image when no category matches', () => {
    const product = { slug: 'no-image', category: 'unknown-category' }
    const fallback = [{ category: 'laptop', image: 'laptop-fallback.jpg' }]
    const normalized = normalizeCatalogProduct(product, fallback)
    expect(normalized.image).toBe('laptop-fallback.jpg')
  })

  it('coerces a missing/invalid specs field to an empty array', () => {
    const normalized = normalizeCatalogProduct({ slug: 'x', category: 'laptop', specs: null })
    expect(normalized.specs).toEqual([])
  })

  it('defaults previousPrice to null when absent', () => {
    const normalized = normalizeCatalogProduct({ slug: 'x', category: 'laptop' })
    expect(normalized.previousPrice).toBeNull()
  })

  it('derives availability from bundled products without exposing it through the API', () => {
    expect(normalizeCatalogProduct({ slug: 'x', category: 'laptop', stock: 2 }).inStock).toBe(true)
    expect(normalizeCatalogProduct({ slug: 'y', category: 'laptop', stock: 0 }).inStock).toBe(false)
  })
})

describe('mergeCatalogProducts', () => {
  it('returns bundled products when there are no managed products', () => {
    const bundled = [{ slug: 'a', category: 'laptop' }]
    expect(mergeCatalogProducts([], bundled)).toHaveLength(1)
  })

  it('prefers managed products over bundled ones with the same slug', () => {
    const managed = [{ slug: 'shared', category: 'laptop', title: 'Managed Version' }]
    const bundled = [{ slug: 'shared', category: 'laptop', title: 'Bundled Version' }]
    const merged = mergeCatalogProducts(managed, bundled)
    expect(merged).toHaveLength(1)
    expect(merged[0].title).toBe('Managed Version')
  })

  it('appends bundled products whose slug is not already managed', () => {
    const managed = [{ slug: 'managed-1', category: 'laptop' }]
    const bundled = [
      { slug: 'managed-1', category: 'laptop' },
      { slug: 'bundled-only', category: 'desktop' },
    ]
    const merged = mergeCatalogProducts(managed, bundled)
    expect(merged.map((p) => p.slug)).toEqual(['managed-1', 'bundled-only'])
  })

  it('handles empty inputs without throwing', () => {
    expect(mergeCatalogProducts()).toEqual([])
  })
})
