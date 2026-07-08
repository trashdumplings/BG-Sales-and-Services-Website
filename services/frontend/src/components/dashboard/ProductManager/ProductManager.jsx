import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LuBox,
  LuCircleCheck,
  LuEye,
  LuEyeOff,
  LuImagePlus,
  LuPackagePlus,
  LuPencil,
  LuSearch,
  LuTrash2,
  LuUpload,
  LuX,
} from 'react-icons/lu'
import { useAuth } from '../../../stores/AuthProvider'
import {
  createCatalogProduct,
  deleteCatalogProduct,
  getCatalogProducts,
  uploadCatalogProductImage,
  updateCatalogProduct,
} from '../../../utils/api'
import DashboardTable from '../../common/DashboardTable/DashboardTable'
import './ProductManager.css'

const emptyForm = {
  title: '',
  slug: '',
  sku: '',
  brand: '',
  category: 'laptop',
  image_url: '',
  price: '',
  previous_price: '',
  stock: '0',
  short_description: '',
  description: '',
  specs: '',
  featured: false,
  is_published: false,
}

const categories = [
  ['laptop', 'Laptops'],
  ['desktop', 'Desktops'],
  ['printer', 'Printers'],
  ['networking', 'Networking'],
  ['audiovisual', 'Audio visual'],
  ['power', 'Power & UPS'],
  ['accessories', 'Accessories'],
]

const productColumns = [
  { key: 'product', label: 'Product', width: '34%' },
  { key: 'category', label: 'Category', width: '14%' },
  { key: 'price', label: 'Price', align: 'right', width: '14%' },
  { key: 'stock', label: 'Stock', align: 'right', width: '10%' },
  { key: 'visibility', label: 'Visibility', width: '14%' },
  { key: 'actions', label: 'Actions', align: 'right', width: '14%' },
]

const categoryCodeMap = {
  laptop: 'LAP',
  desktop: 'DES',
  printer: 'PRI',
  networking: 'NET',
  audiovisual: 'AV',
  power: 'PWR',
  accessories: 'ACC',
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const generateSku = (category, products, editingId = null) => {
  const code = categoryCodeMap[category] || 'GEN'
  const count = products.filter((product) => product.category === category && product.id !== editingId).length + 1
  return `BG-${code}-${String(count).padStart(3, '0')}`
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-BT', {
    style: 'currency',
    currency: 'BTN',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const toForm = (product) => ({
  ...emptyForm,
  ...product,
  previous_price: product.previous_price ?? '',
  specs: (product.specs || []).join('\n'),
})

const toPayload = (form) => ({
  ...form,
  slug: slugify(form.slug || form.title) || null,
  price: Number(form.price),
  previous_price: form.previous_price === '' ? null : Number(form.previous_price),
  stock: Number(form.stock),
  image_url: form.image_url.trim() || null,
  specs: form.specs.split('\n').map((spec) => spec.trim()).filter(Boolean),
})

export default function ProductManager() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isSkuEditable, setIsSkuEditable] = useState(false)
  const [isSkuManual, setIsSkuManual] = useState(false)
  const modalRef = useRef(null)
  const formBodyRef = useRef(null)

  const loadProducts = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      setProducts(await getCatalogProducts(token))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) =>
      [product.title, product.brand, product.sku, product.category]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [products, search])

  const stats = useMemo(() => ({
    total: products.length,
    published: products.filter((product) => product.is_published).length,
    featured: products.filter((product) => product.featured).length,
    lowStock: products.filter((product) => product.stock <= 5).length,
  }), [products])

  const closeForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview('')
    setIsSkuEditable(false)
    setIsSkuManual(false)
    setError('')
  }, [])

  useEffect(() => {
    if (!isFormOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const lenis = window.__bgLenis
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !saving) closeForm()
    }
    document.body.style.overflow = 'hidden'
    if (lenis?.stop) lenis.stop()
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      if (lenis?.start) lenis.start()
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [closeForm, isFormOpen, saving])

  useEffect(() => {
    if (!isFormOpen) return undefined

    const modal = modalRef.current
    const formBody = formBodyRef.current
    if (!modal || !formBody) return undefined

    const forwardWheelToForm = (event) => {
      if (formBody.contains(event.target)) return
      if (!event.deltaX && !event.deltaY) return

      event.preventDefault()
      formBody.scrollBy({
        left: event.deltaX,
        top: event.deltaY,
        behavior: 'auto',
      })
    }

    modal.addEventListener('wheel', forwardWheelToForm, { passive: false })

    return () => {
      modal.removeEventListener('wheel', forwardWheelToForm)
    }
  }, [isFormOpen])

  useEffect(() => {
    if (!isFormOpen) return

    setForm((current) => {
      const nextSlug = slugify(current.title)
      const nextSku = isSkuManual ? current.sku : generateSku(current.category, products, editingId)

      if (current.slug === nextSlug && current.sku === nextSku) {
        return current
      }

      return {
        ...current,
        slug: nextSlug,
        sku: nextSku,
      }
    })
  }, [editingId, form.title, form.category, isFormOpen, isSkuManual, products])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      sku: generateSku(emptyForm.category, products),
    })
    setImageFile(null)
    setImagePreview('')
    setIsSkuEditable(false)
    setIsSkuManual(false)
    setError('')
    setIsFormOpen(true)
  }

  const openEdit = (product) => {
    setEditingId(product.id)
    setForm(toForm(product))
    setImageFile(null)
    setImagePreview(product.image_url || '')
    setIsSkuEditable(false)
    setIsSkuManual(true)
    setError('')
    setIsFormOpen(true)
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    if (name === 'sku') {
      setIsSkuManual(true)
    }
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleImageUrlChange = (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, image_url: value }))
    setImageFile(null)
    setImagePreview(value)
  }

  const handleImageFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Product image must be 5 MB or smaller.')
      return
    }
    setError('')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setForm((current) => ({ ...current, image_url: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      let imageUrl = form.image_url
      if (imageFile) {
        const uploadedImage = await uploadCatalogProductImage(token, imageFile)
        imageUrl = uploadedImage.url
      }
      const payload = toPayload({ ...form, image_url: imageUrl })
      if (editingId) {
        await updateCatalogProduct(token, editingId, payload)
        setNotice('Product updated successfully.')
      } else {
        await createCatalogProduct(token, payload)
        setNotice('Product added to the catalog.')
      }
      closeForm()
      await loadProducts()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return
    setError('')
    try {
      await deleteCatalogProduct(token, product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setNotice('Product deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const togglePublished = async (product) => {
    setError('')
    try {
      const updated = await updateCatalogProduct(token, product.id, {
        is_published: !product.is_published,
      })
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(updated.is_published ? 'Product published.' : 'Product moved to draft.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="product-manager">
      <header className="product-manager__header">
        <div>
          <span>Website commerce</span>
          <h1>Product catalog</h1>
          <p>Create and manage the products customers see on the public storefront.</p>
        </div>
        <button type="button" className="product-manager__add" onClick={openCreate}>
          <LuPackagePlus /> Add product
        </button>
      </header>

      <section className="product-manager__stats" aria-label="Catalog summary">
        <article><LuBox /><span>All products</span><strong>{stats.total}</strong></article>
        <article><LuCircleCheck /><span>Published</span><strong>{stats.published}</strong></article>
        <article><LuEye /><span>Featured</span><strong>{stats.featured}</strong></article>
        <article><LuPackagePlus /><span>Low stock</span><strong>{stats.lowStock}</strong></article>
      </section>

      {notice ? <div className="product-manager__notice" role="status"><LuCircleCheck /> {notice}<button type="button" onClick={() => setNotice('')}><LuX /></button></div> : null}
      {error && !isFormOpen ? <div className="product-manager__error" role="alert">{error}</div> : null}

      <section className="product-manager__catalog">
        <div className="product-manager__toolbar">
          <div className="product-manager__search">
            <LuSearch />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, brands, SKU..." />
          </div>
          <span>{filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <div className="product-manager__empty">Loading product catalog...</div>
        ) : filteredProducts.length ? (
          <DashboardTable
            columns={productColumns}
            rows={filteredProducts}
            rowKey="id"
            minWidth={960}
            emptyTitle="No products found"
            emptyDescription="Add your first storefront product or change the search."
            renderCell={(product, column) => {
              switch (column.key) {
                case 'product':
                  return (
                    <div className="product-manager__product">
                      <div className="product-manager__thumb">
                        {product.image_url ? <img src={product.image_url} alt="" /> : <LuBox />}
                      </div>
                      <div>
                        <strong>{product.title}</strong>
                        <span>{product.brand} · {product.sku}</span>
                      </div>
                    </div>
                  )
                case 'category':
                  return <span className="product-manager__category">{product.category}</span>
                case 'price':
                  return (
                    <>
                      <strong>{formatCurrency(product.price)}</strong>
                      {product.previous_price ? <del>{formatCurrency(product.previous_price)}</del> : null}
                    </>
                  )
                case 'stock':
                  return <span className={product.stock <= 5 ? 'is-low-stock' : ''}>{product.stock}</span>
                case 'visibility':
                  return (
                    <button
                      type="button"
                      className={`product-manager__visibility ${product.is_published ? 'is-live' : ''}`}
                      onClick={() => togglePublished(product)}
                    >
                      {product.is_published ? <LuEye /> : <LuEyeOff />}
                      {product.is_published ? 'Published' : 'Draft'}
                    </button>
                  )
                case 'actions':
                  return (
                    <div className="product-manager__actions">
                      <button type="button" onClick={() => openEdit(product)} aria-label={`Edit ${product.title}`}>
                        <LuPencil />
                      </button>
                      <button type="button" className="danger" onClick={() => handleDelete(product)} aria-label={`Delete ${product.title}`}>
                        <LuTrash2 />
                      </button>
                    </div>
                  )
                default:
                  return null
              }
            }}
          />
        ) : (
          <div className="product-manager__empty"><LuPackagePlus /><h2>No products found</h2><p>Add your first storefront product or change the search.</p><button type="button" onClick={openCreate}>Add product</button></div>
        )}
      </section>

      <button type="button" className={`product-form-backdrop ${isFormOpen ? 'is-open' : ''}`} onClick={closeForm} aria-label="Close product form" />
      <section ref={modalRef} className={`product-form-modal ${isFormOpen ? 'is-open' : ''}`} aria-hidden={!isFormOpen} role="dialog" aria-modal="true" aria-labelledby="product-form-title" data-lenis-prevent>
        <div className="product-form-modal__header"><div><span>{editingId ? 'Edit catalog item' : 'New catalog item'}</span><h2 id="product-form-title">{editingId ? 'Update product' : 'Add product'}</h2><p>Complete the product information and choose when it should appear on the website.</p></div><button type="button" onClick={closeForm} aria-label="Close"><LuX /></button></div>
        <form onSubmit={handleSubmit} className="product-form">
          <div ref={formBodyRef} className="product-form__body" data-lenis-prevent>
            {error ? <div className="product-manager__error" role="alert">{error}</div> : null}
            <div className="product-form__grid">
              <label className="wide">Product name<input required name="title" value={form.title} onChange={handleChange} /></label>
              <label className="product-form__sku-field">
                <span className="product-form__field-head">
                  <span>SKU</span>
                  <button
                    type="button"
                    className="product-form__sku-toggle"
                    onClick={() => {
                      if (isSkuEditable) {
                        setIsSkuEditable(false)
                        setIsSkuManual(false)
                      } else {
                        setIsSkuEditable(true)
                      }
                    }}
                  >
                    {isSkuEditable ? 'Use auto SKU' : 'Edit SKU'}
                  </button>
                </span>
                <input required name="sku" value={form.sku} onChange={handleChange} placeholder="BG-LAP-001" readOnly={!isSkuEditable} />
                <small>{isSkuEditable ? 'Enter your own stock code if you need a custom reference.' : 'Generated automatically from the selected category.'}</small>
              </label>
              <label>Brand<input required name="brand" value={form.brand} onChange={handleChange} /></label>
              <label>Category<select name="category" value={form.category} onChange={handleChange}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Price (Nu.)<input required min="0" step="0.01" type="number" name="price" value={form.price} onChange={handleChange} /></label>
              <label>Previous price<input min="0" step="0.01" type="number" name="previous_price" value={form.previous_price} onChange={handleChange} /></label>
              <label>Stock<input required min="0" type="number" name="stock" value={form.stock} onChange={handleChange} /></label>
              <div className="product-form__image-field wide">
                <span className="product-form__field-label">Product image</span>
                <div className="product-form__upload">
                  <div className={`product-form__preview ${imagePreview ? 'has-image' : ''}`}>
                    {imagePreview ? <img src={imagePreview} alt="Product preview" /> : <LuImagePlus />}
                  </div>
                  <div className="product-form__upload-copy">
                    <strong>{imageFile ? imageFile.name : imagePreview ? 'Product image selected' : 'Upload a product image'}</strong>
                    <p>JPG, PNG or WebP. Maximum file size 5 MB.</p>
                    <div>
                      <label className="product-form__upload-button"><LuUpload /> Choose from device<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} /></label>
                      {imagePreview ? <button type="button" onClick={removeImage}>Remove</button> : null}
                    </div>
                  </div>
                </div>
                <label className="product-form__image-url">Or paste an image URL<input type="url" name="image_url" value={form.image_url} onChange={handleImageUrlChange} placeholder="https://..." /></label>
              </div>
              <label className="wide">Short description<textarea required rows="2" maxLength="500" name="short_description" value={form.short_description} onChange={handleChange} /></label>
              <label className="wide">Full description<textarea required rows="5" name="description" value={form.description} onChange={handleChange} /></label>
              <label className="wide">Specifications<textarea rows="6" name="specs" value={form.specs} onChange={handleChange} placeholder={'One specification per line\nIntel Core i7\n16GB RAM\n512GB SSD'} /></label>
            </div>
            <div className="product-form__checks"><label><input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Feature this product</label><label><input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} /> Publish on website</label></div>
          </div>
          <div className="product-form__footer"><button type="button" onClick={closeForm}>Cancel</button><button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add product'}</button></div>
        </form>
      </section>
    </div>
  )
}
