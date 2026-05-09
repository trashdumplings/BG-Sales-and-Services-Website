import './ProductDetail.css'
import { Link, Navigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiFileText } from 'react-icons/fi'
import { getProductBySlug } from '../../../stores/Data'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-BT', {
    style: 'currency',
    currency: 'BTN',
    maximumFractionDigits: 0
  }).format(value)

export default function ProductDetail() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)

  if (!product) {
    return <Navigate to="/product" replace />
  }

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
            <span className="product-detail-kicker">{product.categoryLabel} · {product.brand}</span>
            <h1>{product.title}</h1>
            <p className="product-detail-summary">{product.description}</p>

            <div className="product-detail-pricing">
              <strong>{formatCurrency(product.price)}</strong>
              {product.previousPrice ? <span>{formatCurrency(product.previousPrice)}</span> : null}
            </div>

            <div className="product-detail-availability">
              <FiCheckCircle />
              <span>{product.stock > 0 ? `${product.stock} units currently available` : 'Currently unavailable'}</span>
            </div>

            <div className="product-detail-actions">
              <a
                className="product-detail-btn primary"
                href={`mailto:sales@bgservices.com?subject=Quotation request - ${encodeURIComponent(product.title)}`}
              >
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
              This storefront flow is designed for marketing and sales discovery first, with a quotation-led
              commercial journey for teams that need project pricing, deployment support, or bulk procurement.
            </p>
          </article>

          <article className="product-detail-panel">
            <h2>Key Specifications</h2>
            <ul>
              {product.specs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  )
}
