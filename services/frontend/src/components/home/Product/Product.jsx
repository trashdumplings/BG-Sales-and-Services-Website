import './Product.css'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import laptop from '../../../assets/products/laptop/pavillion.png'
import desktop from '../../../assets/product-section/desktop.avif'
import printer from '../../../assets/product-section/printers.avif'
import cctv from '../../../assets/product-section/cctv.png'
import soundSystem from '../../../assets/product-section/sound system.jpg'
import ups from '../../../assets/product-section/UPS.jpg'

const Product = () => {
  // Memoize products data to prevent recreation on every render
  const products = useMemo(() => [
    { id: 1, image: laptop, name: "Laptops", icon: "💻" },
    { id: 2, image: desktop, name: "Desktop Computers", icon: "🖥️" },
    { id: 3, image: printer, name: "Printers & Scanners", icon: "🖨️" },
    { id: 4, image: cctv, name: "CCTV Systems", icon: "📹" },
    { id: 5, image: soundSystem, name: "Sound Systems", icon: "🔊" },
    { id: 6, image: ups, name: "UPS & Power Solutions", icon: "🔋" }
  ], [])

  // Memoize animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  }), [])

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] } }
  }), [])

  return (
    <section id='product' className='section section--spacious'>
      <div className='products-wrapper'>
        <div className='products-header'>
          <h2 className='h2'>IT Products & Solutions</h2>
          <p className='text-secondary'>BG Sales & Supplies specializes in enterprise-grade IT hardware and infrastructure solutions. From computing devices and security systems to power management and audio solutions, we provide comprehensive products backed by expert installation and support services.</p>
        </div>

        <motion.div 
          className='products-grid'
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          {products.map((product) => (
            <motion.div key={product.id} className='product-card' variants={itemVariants}>
              <div className='product-image'>
                <img src={product.image} alt={product.name} />
                <div className='product-overlay'>
                  <span className='product-icon'>{product.icon}</span>
                </div>
              </div>
              <div className='product-info'>
                <h3>{product.name}</h3>
                <p>Enterprise-grade solutions for your business</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className='products-cta'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: false }}
        >
          <a href='/product' className='btn btn-primary btn-lg'>
            View All Products
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default Product
