import './Card.css'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheckCircle, FiPlus } from 'react-icons/fi'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-BT', {
    style: 'currency',
    currency: 'BTN',
    maximumFractionDigits: 0
  }).format(value)

const Card = memo(({ product, onAddToQuote, onOpenQuote, isAdded = false }) => {
  const discountPercent = product.previousPrice
    ? Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)
    : 0

  return (
    <motion.article className="store-card">
      <div className="store-card__badges">
        {discountPercent > 0 && <span className="store-card__discount">-{discountPercent}%</span>}
        {product.featured && <span className="store-card__featured">Featured</span>}
        <span className={`store-card__stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
          {product.inStock ? 'In stock' : 'Out of stock'}
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

        <ul className="store-card__specs">
          {product.specs.slice(0, 3).map((spec) => (
            <li key={spec}>
              <FiCheckCircle /> {spec}
            </li>
          ))}
        </ul>

        <div className="store-card__pricing">
          <strong>{formatCurrency(product.price)}</strong>
          {product.previousPrice ? <span>{formatCurrency(product.previousPrice)}</span> : null}
        </div>

        <div className="store-card__actions">
          <Link to={`/product/${product.slug}`} className="store-card__action primary">
            View Details <FiArrowRight />
          </Link>
          <button
            type="button"
            className={`store-card__action secondary ${isAdded ? 'is-added' : ''}`}
            onClick={() => (isAdded ? onOpenQuote?.() : onAddToQuote?.(product))}
          >
            {isAdded ? 'In Quote Cart' : 'Add to Quote'} {isAdded ? <FiCheckCircle /> : <FiPlus />}
          </button>
        </div>
      </div>
    </motion.article>
  )
})

Card.displayName = 'Card'

export default Card
