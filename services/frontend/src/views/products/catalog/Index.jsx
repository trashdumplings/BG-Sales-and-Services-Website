import './Products.css'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiSearch } from 'react-icons/fi'
import logo from '../../../assets/logo.png'
import Card from '../../../components/common/Card/Card'
import { featuredProducts, productCategories } from '../../../stores/Data'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-BT', {
    style: 'currency',
    currency: 'BTN',
    maximumFractionDigits: 0
  }).format(value)

const sortProducts = (items, sortBy) => {
  const copy = [...items]

  switch (sortBy) {
    case 'price-low':
      return copy.sort((a, b) => a.price - b.price)
    case 'price-high':
      return copy.sort((a, b) => b.price - a.price)
    case 'name':
      return copy.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return copy.sort((a, b) => Number(b.featured) - Number(a.featured))
  }
}

const Products = ({ products = [] }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const { category } = useParams()
  const navigate = useNavigate()

  const activeCategory = productCategories.some((item) => item.slug === category)
    ? category
    : 'all'

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    const categoryFiltered = activeCategory === 'all'
      ? products
      : products.filter((product) => product.category === activeCategory)

    const searchFiltered = normalizedSearch
      ? categoryFiltered.filter((product) =>
          [
            product.title,
            product.brand,
            product.categoryLabel,
            product.shortDescription
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        )
      : categoryFiltered

    return sortProducts(searchFiltered, sortBy)
  }, [activeCategory, products, searchTerm, sortBy])

  const activeCategoryLabel = productCategories.find((item) => item.slug === activeCategory)?.label ?? 'All Products'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const handleCategoryClick = (nextCategory) => {
    navigate(nextCategory === 'all' ? '/product' : `/products/${nextCategory}`)
  }

  return (
    <div className="products-page">
      <div className="products-logo-section">
        <Link to="/" className="products-logo-link">
          <img src={logo} alt="BG Sales & Supplies Logo" className="products-logo" />
        </Link>
        <div className="products-mini-nav">
          <Link to="/">Home</Link>
          <Link to="/portal">Portal</Link>
        </div>
      </div>

      <section className="products-hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="hero-kicker">BG Storefront</span>
          <h1 className="hero-title">A modern catalog for business-ready IT procurement.</h1>
          <p className="hero-subtitle">
            Browse laptops, desktops, and printers with featured offers, quick category browsing,
            and direct quotation flows for your team.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#catalog">Shop the catalog</a>
            <a className="btn btn-secondary" href="mailto:sales@bgservices.com">Request a quotation</a>
          </div>
        </motion.div>
      </section>

      <section className="featured-strip">
        <div className="featured-strip__inner">
          {featuredProducts.slice(0, 4).map((product) => (
            <Link key={product.id} to={`/product/${product.slug}`} className="featured-strip__card">
              <span className="featured-strip__label">{product.categoryLabel}</span>
              <strong>{product.title}</strong>
              <span>{formatCurrency(product.price)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="products-toolbar" id="catalog">
        <div className="toolbar-container">
          <div className="search-section">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="toolbar-controls">
            <div className="category-chips">
              {productCategories.map((item) => (
                <button
                  key={item.slug}
                  className={`category-chip ${activeCategory === item.slug ? 'is-active' : ''}`}
                  onClick={() => handleCategoryClick(item.slug)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>

            <span className="results-count">
              {activeCategoryLabel} · {filteredProducts.length} products
            </span>
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="products-section__heading">
          <div>
            <p className="section-eyebrow">Catalog</p>
            <h2>{activeCategoryLabel}</h2>
          </div>
          <p>
            Store-style browsing for featured products, team procurement, and quotation-based sales.
          </p>
        </div>
        <motion.div 
          className="products-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <Card product={product} />
              </motion.div>
            ))
          ) : (
            <div className="no-products">
              <p>No products found matching your search.</p>
            </div>
          )}
        </motion.div>
      </section>

      <section className="products-cta">
        <div className="cta-content">
          <h3>Need bulk pricing or project-specific sourcing?</h3>
          <p>Use the storefront as your catalog, then move qualified buyers into a quotation flow.</p>
          <div className="cta-buttons">
            <a className="btn btn-primary" href="mailto:sales@bgservices.com">Contact Sales</a>
            <a className="btn btn-secondary" href="/product">Browse All Products</a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Products
