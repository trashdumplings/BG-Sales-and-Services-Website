import { useEffect, useState } from 'react'
import products from '../../../stores/Data'
import { getPublicProducts } from '../../../utils/api'
import { mergeCatalogProducts } from '../../../utils/catalogProducts'
import Products from '../catalog/Index'

const Controller = () => {
  const [catalogProducts, setCatalogProducts] = useState(products)

  useEffect(() => {
    let active = true
    getPublicProducts()
      .then((items) => {
        if (active) setCatalogProducts(mergeCatalogProducts(items, products))
      })
      .catch(() => {
        // Keep the bundled catalog available when the backend is offline.
      })
    return () => { active = false }
  }, [])

  return <Products products={catalogProducts} />
}

export default Controller
