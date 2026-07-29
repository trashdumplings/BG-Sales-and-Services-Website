import './Products.css'
import '../StorefrontRefinement.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  FiArrowDown,
  FiArrowRight,
  FiArrowUpRight,
  FiCheckCircle,
  FiFilter,
  FiMail,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiSliders,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import logo from '../../../assets/logo.png'
import storefrontHero from '../../../assets/landing-bhutan/product-storefront-hero.jpg'
import Card from '../../../components/common/Card/Card'
import { productCategories as baseProductCategories } from '../../../stores/Data'
import { getCategoryLabel } from '../../../utils/catalogProducts'
import { recordProductInteraction } from '../../../utils/api'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-BT', {
    style: 'currency',
    currency: 'BTN',
    maximumFractionDigits: 0,
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

const readSavedQuote = () => {
  try {
    const savedQuote = JSON.parse(window.localStorage.getItem('bg-quote-basket') || '[]')
    return Array.isArray(savedQuote)
      ? savedQuote.filter((item) => item?.product?.slug && Number(item.quantity) > 0)
      : []
  } catch {
    return []
  }
}

const Products = ({ products = [] }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [priceBand, setPriceBand] = useState('all')
  const [quoteProduct, setQuoteProduct] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [buyerContact, setBuyerContact] = useState('')
  const [quoteMessage, setQuoteMessage] = useState('')
  const [quoteItems, setQuoteItems] = useState(readSavedQuote)
  const [isQuoteOpen, setIsQuoteOpen] = useState(false)
  const [cartNotice, setCartNotice] = useState('')
  const { category } = useParams()
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroImageY = useTransform(heroScrollProgress, [0, 1], ['0%', '14%'])
  const heroImageScale = useTransform(heroScrollProgress, [0, 1], [1, 1.06])
  const heroCopyY = useTransform(heroScrollProgress, [0, 1], ['0%', '28%'])
  const heroCopyOpacity = useTransform(heroScrollProgress, [0, 0.72], [1, 0])

  const productCategories = useMemo(() => {
    const knownCategories = new Set(baseProductCategories.map((item) => item.slug))
    const dynamicCategories = Array.from(new Set(products.map((product) => product.category)))
      .filter((slug) => slug && !knownCategories.has(slug))
      .map((slug) => ({ slug, label: getCategoryLabel(slug) }))
    return [...baseProductCategories, ...dynamicCategories]
  }, [products])

  const activeCategory = productCategories.some((item) => item.slug === category)
    ? category
    : 'all'

  const brands = useMemo(
    () => ['all', ...Array.from(new Set(products.map((product) => product.brand))).sort()],
    [products],
  )

  const categoryCounts = useMemo(
    () =>
      productCategories.reduce((counts, item) => {
        counts[item.slug] =
          item.slug === 'all'
            ? products.length
            : products.filter((product) => product.category === item.slug).length
        return counts
      }, {}),
    [productCategories, products],
  )

  const categoryTiles = useMemo(
    () =>
      productCategories
        .filter((item) => item.slug !== 'all')
        .map((item) => {
          const categoryProducts = products.filter((product) => product.category === item.slug)
          return {
            ...item,
            count: categoryProducts.length,
            image: categoryProducts[0]?.image,
            price: categoryProducts.length
              ? Math.min(...categoryProducts.map((product) => product.price))
              : 0,
          }
        }),
    [productCategories, products],
  )

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    const categoryFiltered =
      activeCategory === 'all'
        ? products
        : products.filter((product) => product.category === activeCategory)

    const brandFiltered =
      selectedBrand === 'all'
        ? categoryFiltered
        : categoryFiltered.filter((product) => product.brand === selectedBrand)

    const stockFiltered =
      stockFilter === 'available'
        ? brandFiltered.filter((product) => product.stock > 0)
        : stockFilter === 'low'
          ? brandFiltered.filter((product) => product.stock > 0 && product.stock <= 5)
          : brandFiltered

    const priceFiltered = stockFiltered.filter((product) => {
      if (priceBand === 'under-30000') return product.price < 30000
      if (priceBand === '30000-60000') return product.price >= 30000 && product.price <= 60000
      if (priceBand === '60000-plus') return product.price > 60000
      return true
    })

    const searchFiltered = normalizedSearch
      ? priceFiltered.filter((product) =>
          [
            product.title,
            product.brand,
            product.categoryLabel,
            product.shortDescription,
            product.specs.join(' '),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : priceFiltered

    return sortProducts(searchFiltered, sortBy)
  }, [activeCategory, priceBand, products, searchTerm, selectedBrand, sortBy, stockFilter])

  const activeCategoryLabel =
    productCategories.find((item) => item.slug === activeCategory)?.label ?? 'All Products'
  const selectedQuoteProduct = products.find((product) => product.slug === quoteProduct)
  const basketCount = quoteItems.reduce((total, item) => total + item.quantity, 0)
  const basketTotal = quoteItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )
  const quoteLines = [
    ...quoteItems.map(
      (item) =>
        `${item.product.title} x ${item.quantity} - ${formatCurrency(item.product.price * item.quantity)}`,
    ),
    selectedQuoteProduct ? selectedQuoteProduct.title : '',
  ].filter(Boolean)
  const quoteSubject = quoteLines.length
    ? `Quotation request - ${quoteLines[0]}${quoteLines.length > 1 ? ` + ${quoteLines.length - 1} more` : ''}`
    : 'Product quotation request'
  const quoteBody = [
    quoteLines.length ? `Products:\n${quoteLines.map((item) => `- ${item}`).join('\n')}` : 'Product: General catalog inquiry',
    `Quantity: ${quantity || 'Not specified'}`,
    buyerContact ? `Contact: ${buyerContact}` : '',
    quoteMessage ? `Message: ${quoteMessage}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
  const quoteMailto = `mailto:bgsales@outlook.com?subject=${encodeURIComponent(quoteSubject)}&body=${encodeURIComponent(quoteBody)}`
  const hasActiveFilters =
    Boolean(searchTerm) || selectedBrand !== 'all' || stockFilter !== 'all' || priceBand !== 'all'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  useEffect(() => {
    window.localStorage.setItem('bg-quote-basket', JSON.stringify(quoteItems))
  }, [quoteItems])

  useEffect(() => {
    if (!cartNotice) return undefined
    const timer = window.setTimeout(() => setCartNotice(''), 2400)
    return () => window.clearTimeout(timer)
  }, [cartNotice])

  useEffect(() => {
    if (!isQuoteOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsQuoteOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isQuoteOpen])

  const handleCategoryClick = (nextCategory) => {
    navigate(nextCategory === 'all' ? '/product' : `/products/${nextCategory}`)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedBrand('all')
    setStockFilter('all')
    setPriceBand('all')
    setSortBy('featured')
  }

  const addToQuote = (product) => {
    setQuoteItems((current) => {
      if (current.some((item) => item.product.slug === product.slug)) return current
      return [...current, { product, quantity: 1 }]
    })
    setCartNotice(`${product.title} added to your quote`)
    recordProductInteraction(product.slug, 'quote_add').catch(() => {
      // Analytics must never interrupt the customer's shopping flow.
    })
  }

  const removeFromQuote = (slug) => {
    setQuoteItems((current) => current.filter((item) => item.product.slug !== slug))
  }

  const updateQuoteQuantity = (slug, nextQuantity) => {
    if (nextQuantity < 1) {
      removeFromQuote(slug)
      return
    }

    setQuoteItems((current) =>
      current.map((item) =>
        item.product.slug === slug ? { ...item, quantity: nextQuantity } : item,
      ),
    )
  }

  return (
    <div className="products-page">
      <header className="products-logo-section">
        <Link to="/" className="products-logo-link">
          <img src={logo} alt="BG Sales & Supplies Logo" className="products-logo" />
          <span>BG Sales &amp; Supplies</span>
        </Link>
        <div className="products-mini-nav">
          <Link to="/">Home</Link>
          <a href="#categories">Categories</a>
          <a href="#catalog">Catalog</a>
          <a href="mailto:bgsales@outlook.com">Contact sales</a>
          <button
            className="products-nav-quote"
            type="button"
            onClick={() => setIsQuoteOpen(true)}
          >
            {basketCount ? `${basketCount} in cart` : 'Quote cart'} <FiShoppingBag />
          </button>
        </div>
      </header>

      <section className="products-hero" ref={heroRef}>
        <motion.div
          className="products-hero__media"
          style={{ y: heroImageY, scale: heroImageScale }}
        >
          <img
            src={storefrontHero}
            alt="Business technology displayed against a Himalayan-inspired landscape"
          />
        </motion.div>
        <div className="products-hero__veil" />
        <motion.div
          className="products-hero__content"
          style={{ y: heroCopyY, opacity: heroCopyOpacity }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="products-hero__kicker">Business technology, thoughtfully sourced</span>
          <h1>
            Technology for
            <span>better work.</span>
          </h1>
          <p>
            Explore dependable workplace technology, compare essential specifications, and receive
            a tailored quotation with availability and deployment guidance.
          </p>
          <div className="products-hero__actions">
            <a className="products-hero__primary" href="#catalog">
              Browse products <FiArrowDown />
            </a>
            <button
              className="products-hero__secondary"
              type="button"
              onClick={() => setIsQuoteOpen(true)}
            >
              Request a quote <FiShoppingBag />
            </button>
          </div>
        </motion.div>
        <div className="products-hero__index" aria-hidden="true">
          <span>Store</span>
          <div />
          <span>{products.length} products</span>
        </div>
      </section>

      <section className="shop-category-grid" id="categories">
        <div className="shop-section-heading">
          <div>
            <span>Shop by category</span>
            <h2>Find what your team needs.</h2>
          </div>
          <a href="#catalog">View full catalog <FiArrowUpRight /></a>
        </div>
        <div className="shop-category-grid__items">
          {categoryTiles.map((item) => (
            <button
              type="button"
              key={item.slug}
              className="shop-category-tile"
              onClick={() => handleCategoryClick(item.slug)}
            >
              <span>{item.label}</span>
              <strong>{item.count} products</strong>
              {item.price ? <small>From {formatCurrency(item.price)}</small> : null}
              {item.image ? <img src={item.image} alt="" /> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="products-toolbar" id="catalog">
        <div className="toolbar-container">
          <div className="toolbar-topline">
            <div>
              <span>
                <FiFilter /> Catalog controls
              </span>
              <strong>{activeCategoryLabel}</strong>
            </div>
            <button type="button" onClick={resetFilters} disabled={!hasActiveFilters}>
              <FiRefreshCw /> Reset filters
            </button>
          </div>

          <div className="search-section">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by model, brand, specs..."
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
                  type="button"
                  key={item.slug}
                  className={`category-chip ${activeCategory === item.slug ? 'is-active' : ''}`}
                  onClick={() => handleCategoryClick(item.slug)}
                >
                  {item.label}
                  <span>{categoryCounts[item.slug] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="filter-selects">
              <label>
                Brand
                <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand === 'all' ? 'All brands' : brand}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Availability
                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                  <option value="all">All stock</option>
                  <option value="available">In stock</option>
                  <option value="low">Low stock</option>
                </select>
              </label>

              <label>
                Budget
                <select value={priceBand} onChange={(e) => setPriceBand(e.target.value)}>
                  <option value="all">All prices</option>
                  <option value="under-30000">Under Nu. 30,000</option>
                  <option value="30000-60000">Nu. 30,000 - 60,000</option>
                  <option value="60000-plus">Above Nu. 60,000</option>
                </select>
              </label>

              <label>
                Sort
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="featured">Featured first</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="products-section">
        <aside className="catalog-summary">
          <div className="catalog-summary__panel">
            <span>Catalog result</span>
            <strong>{filteredProducts.length}</strong>
            <p>{activeCategoryLabel} products matching your current filters.</p>
          </div>
          <div className="catalog-summary__panel catalog-summary__panel--dark">
            <FiShoppingBag />
            <strong>{basketCount || 'Quote'} cart</strong>
            <p>{basketCount ? `${basketCount} item${basketCount === 1 ? '' : 's'} ready for quotation.` : 'Add products from cards or shelves.'}</p>
            <button type="button" onClick={() => setIsQuoteOpen(true)}>Open quote cart</button>
          </div>
        </aside>

        <div className="catalog-main">
          <div className="products-section__heading">
            <div>
              <p className="section-eyebrow">All products</p>
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
                  <Card
                    product={product}
                    onAddToQuote={addToQuote}
                    onOpenQuote={() => setIsQuoteOpen(true)}
                    isAdded={quoteItems.some((item) => item.product.slug === product.slug)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="no-products">
                <p>No products found matching your filters.</p>
                <button type="button" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="commerce-path" aria-label="How quotations work">
        <div><FiSearch /><span>01</span><strong>Explore</strong><p>Filter the catalog and compare the specifications that matter.</p></div>
        <div><FiSliders /><span>02</span><strong>Shortlist</strong><p>Add one or more products and adjust the required quantities.</p></div>
        <div><FiMail /><span>03</span><strong>Confirm</strong><p>Our sales team confirms pricing, stock, delivery, and support.</p></div>
      </section>

      <section className="quote-flow" id="quote">
        <div className="quote-flow__copy">
          <span>Quote basket</span>
          <h2>Review products before requesting pricing.</h2>
          <p>
            This works like a lightweight cart, but sends a quotation request instead of taking
            payment. The backend can later store these quote items and create formal inquiries.
          </p>
          <ul>
            <li>
              <FiCheckCircle /> Multiple products captured
            </li>
            <li>
              <FiCheckCircle /> Quantity and buyer contact included
            </li>
            <li>
              <FiCheckCircle /> Backend-ready quote structure
            </li>
          </ul>
        </div>

        <form className="quote-flow__form" onSubmit={(event) => event.preventDefault()}>
          <div className="quote-form__heading">
            <span>Inquiry details</span>
            <p>Choose a product or send a general request. We will confirm availability and pricing.</p>
          </div>

          <div className="quote-basket">
            <span>Basket items</span>
            {quoteItems.length > 0 ? (
              <ul>
                {quoteItems.map((item) => (
                  <li key={item.product.slug}>
                    <img src={item.product.image} alt="" />
                    <div>
                      <strong>{item.product.title}</strong>
                      <small>{item.quantity} x {formatCurrency(item.product.price)}</small>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromQuote(item.product.slug)}
                      aria-label={`Remove ${item.product.title} from quote basket`}
                    >
                      <FiTrash2 />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No products added yet. Use &quot;Add to Quote&quot; on product cards.</p>
            )}
          </div>

          <label className="quote-field">
            <span>Add a product</span>
            <select
              value={quoteProduct}
              onChange={(event) => setQuoteProduct(event.target.value)}
              aria-describedby="quote-product-help"
            >
              <option value="">General product inquiry</option>
              {products.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.title}
                </option>
              ))}
            </select>
            <small id="quote-product-help">Optional if products are already in your basket.</small>
          </label>

          <label className="quote-field">
            <span>Quantity</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>

          <label className="quote-field quote-field--full">
            <span>Email or phone</span>
            <input
              type="text"
              placeholder="Where should we reply?"
              autoComplete="email"
              value={buyerContact}
              onChange={(event) => setBuyerContact(event.target.value)}
            />
          </label>

          <label className="quote-field quote-field--full">
            <span>Project notes</span>
            <textarea
              rows="4"
              placeholder="Mention delivery, installation, preferred brand, or project requirements."
              value={quoteMessage}
              onChange={(event) => setQuoteMessage(event.target.value)}
            />
          </label>

          <a className="quote-flow__submit" href={quoteMailto}>
            Prepare inquiry <FiArrowUpRight />
          </a>
          <small className="quote-flow__mail-note">
            This opens your email app with the inquiry details prepared for review.
          </small>
        </form>
      </section>

      <button
        className={`floating-quote-cart ${basketCount ? 'is-visible' : ''}`}
        type="button"
        onClick={() => setIsQuoteOpen(true)}
        aria-label={`Open quote cart with ${basketCount} items`}
      >
        <span><FiShoppingBag /><b>{basketCount}</b></span>
        <span>Quote cart<small>{formatCurrency(basketTotal)}</small></span>
        <FiArrowRight />
      </button>

      <button
        className={`quote-drawer__backdrop ${isQuoteOpen ? 'is-open' : ''}`}
        type="button"
        aria-label="Close quote cart"
        onClick={() => setIsQuoteOpen(false)}
      />
      <aside
        className={`quote-drawer ${isQuoteOpen ? 'is-open' : ''}`}
        aria-hidden={!isQuoteOpen}
        aria-label="Quote cart"
      >
        <div className="quote-drawer__header">
          <div>
            <span>Your selection</span>
            <h2>Quote cart</h2>
          </div>
          <button type="button" onClick={() => setIsQuoteOpen(false)} aria-label="Close quote cart">
            <FiX />
          </button>
        </div>

        <div className="quote-drawer__body">
          {quoteItems.length ? (
            quoteItems.map((item) => (
              <article className="quote-drawer__item" key={item.product.slug}>
                <Link to={`/product/${item.product.slug}`} onClick={() => setIsQuoteOpen(false)}>
                  <img src={item.product.image} alt={item.product.title} />
                </Link>
                <div>
                  <small>{item.product.brand}</small>
                  <strong>{item.product.title}</strong>
                  <span>{formatCurrency(item.product.price)}</span>
                  <div className="quote-drawer__quantity">
                    <button
                      type="button"
                      onClick={() => updateQuoteQuantity(item.product.slug, item.quantity - 1)}
                      aria-label={`Decrease ${item.product.title} quantity`}
                    >
                      <FiMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuoteQuantity(item.product.slug, item.quantity + 1)}
                      aria-label={`Increase ${item.product.title} quantity`}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
                <button
                  className="quote-drawer__remove"
                  type="button"
                  onClick={() => removeFromQuote(item.product.slug)}
                  aria-label={`Remove ${item.product.title}`}
                >
                  <FiTrash2 />
                </button>
              </article>
            ))
          ) : (
            <div className="quote-drawer__empty">
              <FiShoppingBag />
              <h3>Your quote cart is empty.</h3>
              <p>Add products while browsing and they will stay here for your next visit.</p>
              <button type="button" onClick={() => setIsQuoteOpen(false)}>Continue shopping</button>
            </div>
          )}
        </div>

        <div className="quote-drawer__footer">
          <div><span>Estimated subtotal</span><strong>{formatCurrency(basketTotal)}</strong></div>
          <small>Final pricing, stock, delivery, and installation are confirmed by our team.</small>
          <a href="#quote" onClick={() => setIsQuoteOpen(false)}>
            Continue to quotation <FiArrowRight />
          </a>
        </div>
      </aside>

      {cartNotice ? (
        <div className="cart-notice" role="status">
          <FiCheckCircle /> <span>{cartNotice}</span>
          <button type="button" onClick={() => setIsQuoteOpen(true)}>View cart</button>
        </div>
      ) : null}

      <section className="products-cta">
        <div className="cta-content">
          <h3>Need bulk pricing or project-specific sourcing?</h3>
          <p>Use the storefront as your catalog, then move qualified buyers into a quotation flow.</p>
          <div className="cta-buttons">
            <a className="btn btn-primary" href="#quote">Start a quote</a>
            <a className="btn btn-secondary" href="/product">Browse All Products</a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Products
