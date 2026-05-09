import './Card.css'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiFileText } from 'react-icons/fi'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-BT', {
    style: 'currency',
    currency: 'BTN',
    maximumFractionDigits: 0
  }).format(value)

const Card = memo(({ product }) => {
  const discountPercent = product.previousPrice
    ? Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)
    : 0

  return (
    <motion.article className="store-card" whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
      <div className="store-card__badges">
        {discountPercent > 0 && <span className="store-card__discount">-{discountPercent}%</span>}
        <span className={`store-card__stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </span>
      </div>

      <Link to={`/product/${product.slug}`} className="store-card__image-link">
        <div className="store-card__image-wrap">
          <img src={product.image} alt={product.title} className="store-card__image" />
        </div>
      </Link>

      <div className="store-card__body">
        <div className="store-card__meta">
          <span>{product.categoryLabel}</span>
          <span>{product.brand}</span>
        </div>

        <Link to={`/product/${product.slug}`} className="store-card__title-link">
          <h3 className="store-card__title">{product.title}</h3>
        </Link>

        <p className="store-card__description">{product.shortDescription}</p>

        <div className="store-card__pricing">
          <strong>{formatCurrency(product.price)}</strong>
          {product.previousPrice ? <span>{formatCurrency(product.previousPrice)}</span> : null}
        </div>

        <div className="store-card__actions">
          <Link to={`/product/${product.slug}`} className="store-card__action primary">
            View Details <FiArrowRight />
          </Link>
          <a href={`mailto:sales@bgservices.com?subject=Quotation request - ${encodeURIComponent(product.title)}`} className="store-card__action secondary">
            Get Quote <FiFileText />
          </a>
        </div>
      </div>
    </motion.article>
  )
})

Card.displayName = 'Card'

export default Card
