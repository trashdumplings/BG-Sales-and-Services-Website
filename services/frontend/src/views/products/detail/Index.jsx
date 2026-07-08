import './ProductDetail.css'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiCheckCircle,
  FiFileText,
  FiPackage,
} from 'react-icons/fi'
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
      <div className="product-detail-shell">
        <Link to="/product" className="product-detail-back">
          <FiArrowLeft /> Back to catalog
        </Link>

        <section className="product-detail-hero">
          <div className="product-detail-media">
            <img src={product.image} alt={product.title} />
          </div>

          <div className="product-detail-content">
            <span className="product-detail-kicker">
              {product.categoryLabel} / {product.brand}
            </span>
            <h1>{product.title}</h1>
            <p className="product-detail-summary">{product.description}</p>

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

            <div className="product-detail-actions">
              <a className="product-detail-btn primary" href={quoteHref}>
                <FiFileText /> Request Quote
              </a>
              <Link className="product-detail-btn secondary" to={`/products/${product.category}`}>
                More in {product.categoryLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="product-detail-sections">
          <article className="product-detail-panel">
            <h2>Overview</h2>
            <p>{product.shortDescription}</p>
            <p>
              This storefront flow is designed for marketing and sales discovery first, with a
              quotation-led commercial journey for teams that need project pricing, deployment
              support, or bulk procurement.
            </p>
          </article>

          <article className="product-detail-panel">
            <h2>Key Specifications</h2>
            <ul>
              {product.specs.map((spec) => (
                <li key={spec}>
                  <FiCheckCircle /> {spec}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="product-detail-procurement">
          <div>
            <span>Procurement support</span>
            <h2>Buying for a team or project?</h2>
            <p>
              BG Sales can help confirm availability, prepare quotations, source alternatives,
              and support deployment for offices, schools, counters, and project sites.
            </p>
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
