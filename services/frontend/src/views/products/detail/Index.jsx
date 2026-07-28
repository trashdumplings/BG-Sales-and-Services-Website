import './ProductDetail.css'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiCheckCircle,
  FiFileText,
  FiMail,
  FiPackage,
  FiSearch,
} from 'react-icons/fi'
import logo from '../../../assets/logo.png'
import products, { getProductBySlug } from '../../../stores/Data'
import { getPublicProducts } from '../../../utils/api'
import { mergeCatalogProducts } from '../../../utils/catalogProducts'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-BT', {
    style: 'currency',
    currency: 'BTN',
    maximumFractionDigits: 0,
  }).format(value)

export default function ProductDetail() {
  const { slug } = useParams()
  const bundledProduct = getProductBySlug(slug)
  const [product, setProduct] = useState(bundledProduct)
  const [catalogProducts, setCatalogProducts] = useState(products)
  const [loading, setLoading] = useState(!bundledProduct)

  useEffect(() => {
    let active = true
    setLoading(!getProductBySlug(slug))
    getPublicProducts()
      .then((items) => {
        if (!active) return
        const normalized = mergeCatalogProducts(items, products)
        setCatalogProducts(normalized)
        setProduct(normalized.find((item) => item.slug === slug) || getProductBySlug(slug))
      })
      .catch(() => {
        if (active) setProduct(getProductBySlug(slug))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [slug])

  if (loading) {
    return <div className="product-detail-page"><div className="product-detail-loading">Loading product...</div></div>
  }

  if (!product) {
    return <Navigate to="/product" replace />
  }

  const relatedProducts = catalogProducts
    .filter((item) => item.category === product.category && item.slug !== product.slug)
    .slice(0, 3)

  const isUsefulCopy = (value) => {
    const normalized = String(value || '').trim()
    return normalized.length >= 12 && !/^(test|testing|n\/a|none)$/i.test(normalized)
  }
  const summary = isUsefulCopy(product.description)
    ? product.description
    : 'A business-ready product available through BG Sales with quotation, delivery, and deployment support.'
  const overview = isUsefulCopy(product.shortDescription)
    ? product.shortDescription
    : 'Detailed product information is available from our sales team.'
  const usefulSpecs = (product.specs || []).filter(isUsefulCopy)
  const displayedSpecs = usefulSpecs.length
    ? usefulSpecs.slice(0, 5)
    : [
        'Official specification sheet available on request',
        'Business and project pricing available',
        'Delivery and deployment support included',
      ]

  const quoteHref = `mailto:bgsales@outlook.com?subject=${encodeURIComponent(
    `Quotation request - ${product.title}`,
  )}&body=${encodeURIComponent(`Product: ${product.title}\nQuantity:\nContact:\nMessage:`)}`

  const bulkQuoteHref = `mailto:bgsales@outlook.com?subject=${encodeURIComponent(
    `Bulk quotation request - ${product.title}`,
  )}&body=${encodeURIComponent(
    `Product: ${product.title}\nQuantity:\nDelivery location:\nInstallation/support required:\nContact:`,
  )}`

  return (
    <div className="product-detail-page">
      <div className="product-store-announcement">Technology sourcing and procurement support across Bhutan</div>
      <header className="product-store-header">
        <Link to="/" className="product-store-header__brand" aria-label="BG Sales and Supplies home">
          <img src={logo} alt="" />
          <span>BG Sales &amp; Supplies</span>
        </Link>

        <nav className="product-store-header__links" aria-label="Product categories">
          <Link to="/product">All products</Link>
          <Link to="/products/laptops">Laptops</Link>
          <Link to="/products/desktops">Desktops</Link>
          <Link to="/products/printers">Printers</Link>
        </nav>

        <div className="product-store-header__actions">
          <form className="product-store-search" action="/product" role="search">
            <label className="sr-only" htmlFor="product-detail-search">Search products</label>
            <input id="product-detail-search" name="search" type="search" placeholder="Search products..." />
            <button type="submit" aria-label="Search products"><FiSearch /></button>
          </form>
          <a className="product-store-contact" href="mailto:bgsales@outlook.com">
            <FiMail /> <span>Contact sales</span>
          </a>
        </div>
      </header>

      <div className="product-detail-shell">
        <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/product" className="product-detail-breadcrumb__back"><FiArrowLeft /> Products</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/products/${product.category}`}>{product.categoryLabel}</Link>
          <span aria-hidden="true">/</span>
          <span>{product.title}</span>
        </nav>

        <section className="product-detail-hero">
          <div className="product-detail-media">
            <img src={product.image} alt={product.title} />
            <span className="product-detail-media__note">Product image</span>
          </div>

          <div className="product-detail-content">
            <span className="product-detail-kicker">
              {product.brand} · {product.categoryLabel}
            </span>
            <h1>{product.title}</h1>
            <p className="product-detail-summary">{summary}</p>

            <div className="product-detail-pricing">
              <strong>{formatCurrency(product.price)}</strong>
              {product.previousPrice ? <span>{formatCurrency(product.previousPrice)}</span> : null}
            </div>

            <div className="product-detail-availability">
              <FiCheckCircle />
              <span>
                {product.stock > 0
                  ? `${product.stock} units currently available`
                  : 'Currently unavailable'}
              </span>
            </div>

            <div className="product-detail-facts">
              <h2>Product details</h2>
              <ul>
                {displayedSpecs.map((spec) => (
                  <li key={spec}>
                    <FiCheckCircle /> <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="product-detail-actions">
              <a className="product-detail-btn primary" href={quoteHref}>
                <FiFileText /> Request Quote
              </a>
              <a className="product-detail-btn secondary" href="mailto:bgsales@outlook.com">
                <FiMail /> Contact sales
              </a>
            </div>
            <p className="product-detail-response-note">Our sales team usually responds within one business day.</p>
            <Link className="product-detail-category-link" to={`/products/${product.category}`}>
              Browse more {product.categoryLabel} <FiArrowUpRight />
            </Link>
          </div>
        </section>

        <section className="product-detail-overview">
          <span>About this product</span>
          <div>
            <h2>Overview</h2>
            <p>{overview}</p>
            <p>Suitable for organizations that need dependable sourcing, confirmed availability, project pricing, and deployment support.</p>
          </div>
        </section>

        <section className="product-detail-procurement">
          <div>
            <span>Volume procurement</span>
            <h2>Need multiple units?</h2>
            <p>Ask about project pricing, delivery coordination, installation, and alternative models.</p>
          </div>
          <a href={bulkQuoteHref}>
            Start bulk inquiry <FiArrowUpRight />
          </a>
        </section>

        {relatedProducts.length > 0 && (
          <section className="product-detail-related">
            <div className="product-detail-related__heading">
              <span>
                <FiPackage /> Related products
              </span>
              <Link to={`/products/${product.category}`}>View all {product.categoryLabel}</Link>
            </div>
            <div className="product-detail-related__grid">
              {relatedProducts.map((item) => (
                <Link key={item.slug} to={`/product/${item.slug}`} className="product-detail-related__card">
                  <img src={item.image} alt={item.title} />
                  <span>{item.brand}</span>
                  <strong>{item.title}</strong>
                  <em>{formatCurrency(item.price)}</em>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
