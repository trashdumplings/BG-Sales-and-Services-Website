import aspire3 from '../assets/products/laptop/aspire3.png'
import pavillion from '../assets/products/laptop/pavillion.png'
import dellVostro from '../assets/products/laptop/dell_vostro.png'
import lenovoE41 from '../assets/products/laptop/lenevo_E41-55.png'
import lenovoIdeapad from '../assets/products/laptop/lenovo_ideapad.png'
import lenovoV14 from '../assets/products/laptop/lenevoV14.png'
import dellOptiplex from '../assets/products/desktop/dell_optiplex_3050_tiny.png'
import hpLaser from '../assets/products/printer/hplaser1008a.png'

import adbLogo from '../assets/logo/ADB logo.png'
import tBankLogo from '../assets/logo/T bank logo.jpg'
import dgpcLogo from '../assets/logo/DGPC logo.png'
import worldBankLogo from '../assets/logo/world bank logo.jpg'
import bnbLogo from '../assets/logo/BNB logo.png'
import ministryHealthLogo from '../assets/logo/Ministry of health logo.png'
import govtechLogo from '../assets/logo/Govtech logo.png'
import niitLogo from '../assets/logo/NIIT logo.jpg'
import tajParoLogo from '../assets/logo/Taj paro logo.png'

export const projectsData = [
  {
    id: 1,
    clientName: 'ADB/World Bank',
    logo: adbLogo,
    serviceType: 'Strategic Research',
    scope: 'Executed comprehensive socio-economic research and environmental studies, including relevant surveys and analysis for major infrastructure projects such as the East-West Highway and Vocational Training Institute graduates survey.',
    status: 'Completed'
  },
  {
    id: 2,
    clientName: 'T Bank Ltd',
    logo: tBankLogo,
    serviceType: 'Financial & Technical Consultancy',
    scope: "Served as Principal Financial Consultant regarding the bank's establishment, including feasibility studies, banking/credit services design, taxation, and pricing strategies. Simultaneously supplied critical IT infrastructure and CCTV Systems.",
    status: 'Completed'
  },
  {
    id: 3,
    clientName: 'DGPC (ISC Building)',
    logo: dgpcLogo,
    serviceType: 'Turnkey Infrastructure',
    scope: "Completed a 'Design and Build' engagement for the ICT Network, Data Centre, Firefighting systems, and HVAC Solutions, demonstrating integrated MEP capabilities.",
    status: 'Completed'
  },
  {
    id: 4,
    clientName: 'World Bank Group',
    logo: worldBankLogo,
    serviceType: 'Long-term Facility Management',
    scope: 'Acted as Project Management Consultant for ICT, Datacenter, and Electrical works regarding new office construction. Provided Annual Service support for ICT and MEP works for the past 11 years, demonstrating long-term operational reliability.',
    status: 'Completed / Ongoing'
  },
  {
    id: 5,
    clientName: 'Bitdeer',
    serviceType: 'Air-Conditioning Supply & Installation',
    scope: 'Supplied and installed air-conditioning systems for Bitdeer, providing the equipment and on-site installation needed for dependable facility cooling.',
    status: 'Completed'
  },
  {
    id: 6,
    clientName: 'Bhutan National Bank Ltd',
    logo: bnbLogo,
    serviceType: 'Enterprise IT Supply',
    scope: 'Supplied high-performance HPE Servers and storage solutions, deployed CCTV systems for security, and installed Dell Servers and NAS for data redundancy.',
    status: 'Completed'
  },
  {
    id: 7,
    clientName: 'Ministry of Health',
    logo: ministryHealthLogo,
    serviceType: 'Healthcare Infrastructure',
    scope: 'Supplied and installed IP-based Digital EPABX systems, network switches, and critical power backup solutions in healthcare facilities.',
    status: 'Completed'
  },
  {
    id: 8,
    clientName: 'Druk Green Power Corporation',
    logo: govtechLogo,
    serviceType: 'Industrial Networking',
    scope: 'Supplied, installed, and commissioned networks, firefighting systems, and data centres for the ISC Building.',
    status: 'Completed'
  },
  {
    id: 9,
    clientName: 'Govtech Data Centres',
    logo: govtechLogo,
    serviceType: 'Power Reliability',
    scope: 'Supplied and installed robust power solutions to ensure continuous uptime for critical government digital services.',
    status: 'Completed'
  },
  {
    id: 10,
    clientName: 'NITI Limited, India',
    logo: niitLogo,
    serviceType: 'Corporate Consultancy',
    scope: 'Providing ongoing consultancy services regarding project office establishment, taxation system compliance, and financial services management.',
    status: 'Ongoing'
  },
  {
    id: 11,
    clientName: 'Taj Paro',
    logo: tajParoLogo,
    serviceType: 'Hospitality Technology',
    scope: 'Supplying, installing, testing, and commissioning the complete ICT and AV setup for a luxury hospitality environment.',
    status: 'Ongoing'
  }
]

export const productCategories = [
  { slug: 'all', label: 'All Products' },
  { slug: 'laptop', label: 'Laptops' },
  { slug: 'desktop', label: 'Desktops' },
  { slug: 'printer', label: 'Printers' }
]

const products = [
  {
    id: 1,
    slug: 'hp-pavilion-gaming-laptop',
    title: 'HP Pavilion Gaming Laptop',
    brand: 'HP',
    category: 'laptop',
    categoryLabel: 'Laptops',
    image: pavillion,
    previousPrice: 84000,
    price: 79500,
    stock: 4,
    featured: true,
    shortDescription: 'Gaming-ready business laptop with RTX graphics and fast SSD storage.',
    description: 'A high-performance laptop suited for business users who need mobility, strong graphics performance, and dependable multitasking for design, office, and productivity workloads.',
    specs: ['Intel Core i7', '16GB DDR4 RAM', '512GB SSD', '15.6-inch display', 'RTX 3050 graphics']
  },
  {
    id: 2,
    slug: 'acer-aspire-3',
    title: 'Acer Aspire 3',
    brand: 'Acer',
    category: 'laptop',
    categoryLabel: 'Laptops',
    image: aspire3,
    previousPrice: 34999,
    price: 28000,
    stock: 8,
    featured: true,
    shortDescription: 'Affordable entry-level laptop for admin, education, and office work.',
    description: 'An everyday laptop designed for browsing, document work, and lightweight business tasks. Suitable for schools, front-desk teams, and basic office deployments.',
    specs: ['AMD 3020e', '4GB RAM', '256GB NVMe SSD', 'Windows 11 Home', '15.6-inch display']
  },
  {
    id: 3,
    slug: 'dell-vostro-3400',
    title: 'Dell Vostro 3400',
    brand: 'Dell',
    category: 'laptop',
    categoryLabel: 'Laptops',
    image: dellVostro,
    previousPrice: 72000,
    price: 68000,
    stock: 6,
    featured: true,
    shortDescription: 'Business laptop with modern Intel performance for day-to-day office use.',
    description: 'The Dell Vostro line is well suited for organizations that need dependable performance, portability, and manageable business hardware for staff deployment.',
    specs: ['Intel Core i5', '8GB RAM', '512GB SSD', '14-inch display', 'Windows 11']
  },
  {
    id: 4,
    slug: 'lenovo-e41-55',
    title: 'Lenovo E41-55',
    brand: 'Lenovo',
    category: 'laptop',
    categoryLabel: 'Laptops',
    image: lenovoE41,
    previousPrice: 39000,
    price: 38000,
    stock: 7,
    featured: false,
    shortDescription: 'Compact Lenovo laptop built for practical business deployment.',
    description: 'A compact and budget-conscious system for workstations, field teams, or education-led procurement where reliability matters more than premium styling.',
    specs: ['Compact form factor', 'Business-ready setup', 'Windows support', 'Office workflow friendly']
  },
  {
    id: 5,
    slug: 'lenovo-ideapad-3',
    title: 'Lenovo IdeaPad 3',
    brand: 'Lenovo',
    category: 'laptop',
    categoryLabel: 'Laptops',
    image: lenovoIdeapad,
    previousPrice: 55000,
    price: 53150,
    stock: 5,
    featured: true,
    shortDescription: 'Balanced office laptop for multitasking teams and remote work.',
    description: 'An accessible productivity laptop with a practical configuration for team deployments, general business software, and day-to-day communication workloads.',
    specs: ['Lenovo IdeaPad series', 'Business productivity focus', 'Team deployment ready', 'Balanced performance']
  },
  {
    id: 6,
    slug: 'lenovo-v14-g2-itl',
    title: 'Lenovo V14 G2 ITL',
    brand: 'Lenovo',
    category: 'laptop',
    categoryLabel: 'Laptops',
    image: lenovoV14,
    previousPrice: 71000,
    price: 68000,
    stock: 3,
    featured: false,
    shortDescription: 'Professional 14-inch Lenovo laptop for business mobility.',
    description: 'A compact business laptop with a clean form factor, suitable for managers, remote staff, and organizations standardizing on portable office devices.',
    specs: ['14-inch form factor', 'Portable design', 'Professional use case', 'Business deployment ready']
  },
  {
    id: 7,
    slug: 'dell-optiplex-3050-tiny',
    title: 'Dell OptiPlex 3050 Tiny',
    brand: 'Dell',
    category: 'desktop',
    categoryLabel: 'Desktops',
    image: dellOptiplex,
    previousPrice: 27000,
    price: 26000,
    stock: 10,
    featured: true,
    shortDescription: 'Space-saving office desktop for counters, admin desks, and labs.',
    description: 'A compact desktop system that supports business environments where desk space matters. Ideal for reception desks, training labs, and office rollout projects.',
    specs: ['Tiny form factor', '7th Gen platform', 'Business desktop', 'Office workstation ready']
  },
  {
    id: 8,
    slug: 'dell-optiplex-3060-tiny',
    title: 'Dell OptiPlex 3060 Tiny',
    brand: 'Dell',
    category: 'desktop',
    categoryLabel: 'Desktops',
    image: dellOptiplex,
    previousPrice: 28000,
    price: 27000,
    stock: 9,
    featured: false,
    shortDescription: 'Compact Dell desktop upgrade for business workstations.',
    description: 'A practical desktop option for organizations seeking affordable workstation rollouts with a small footprint and familiar enterprise hardware.',
    specs: ['Tiny form factor', '8th Gen platform', 'Business workstation', 'Easy office deployment']
  },
  {
    id: 9,
    slug: 'hp-laser-1008a-printer',
    title: 'HP Laser 1008a Printer',
    brand: 'HP',
    category: 'printer',
    categoryLabel: 'Printers',
    image: hpLaser,
    previousPrice: 27000,
    price: 26000,
    stock: 12,
    featured: true,
    shortDescription: 'Compact laser printer for business documents and office operations.',
    description: 'A reliable office printer suitable for day-to-day monochrome printing, document-heavy teams, and branch office procurement.',
    specs: ['Up to 20 ppm', 'LED display', 'HP Auto-Off technology', 'Power-saving design']
  }
]

export const featuredProducts = products.filter((product) => product.featured)

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug)
}

export default products
