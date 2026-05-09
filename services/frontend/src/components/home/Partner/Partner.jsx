import './Partner.css'
import { useMemo } from 'react'
import three_c_three from '../../../assets/partners/3C3.png'
import cisco from '../../../assets/partners/cisco.png'
import belden from '../../../assets/partners/belden.jpeg'
import digisol from '../../../assets/partners/digisol.png'
import grandstream from '../../../assets/partners/grandstream.png'
import hydai from '../../../assets/partners/hydai.jpg'
import o_ld_systems_logo from '../../../assets/partners/0_ld_systems_logo.jpg'
import AED_WEBSITE_DISTRIBUTION_BRANDS_QSC from '../../../assets/partners/AED_WEBSITE_DISTRIBUTION_BRANDS_QSC Live Sound_5.jpg'
import apc from '../../../assets/partners/APC.png'
import lg from '../../../assets/partners/lg.jpg'
import Commscope_Logo from '../../../assets/partners/Commscope_Logo.jpg'
import Link_Logo_Blue_strap from '../../../assets/partners/D-Link_Logo_Blue_strap.jpg'
import hikvision from '../../../assets/partners/hikvision.png'
import HoneywellLogo from '../../../assets/partners/Honeywell-Logo.png'
import JBLLogo from '../../../assets/partners/JBL-Logo.png'
import logitech from '../../../assets/partners/logitech.png'
import MATRIX from '../../../assets/partners/MATRIX.jpg'
import netrack from '../../../assets/partners/netrack_owler_20190903_081836_original.png'
import newline from '../../../assets/partners/Newline-Logo-FINAL-2.jpg'
import panasonic from '../../../assets/partners/panasonic.png'
import ruckus from '../../../assets/partners/Ruckus.png'
import s1 from '../../../assets/partners/s1-6-1.jpg'
import schneider from '../../../assets/partners/Schneider_Electric_Logo.png'
import secureye from '../../../assets/partners/secureye_Black.png'
import tplink from '../../../assets/partners/TP-Link.logo_3.jpg'
import ubiquiti from '../../../assets/partners/ubiquiti-networks-logo.jpg'
import valrack from '../../../assets/partners/valrack.png'
import vertex from '../../../assets/partners/vertex.png'
import yeastar from '../../../assets/partners/yeastar.png'

const Partner = () => {
  // Memoize partners array to prevent recreation on every render
  const partners = useMemo(() => [
    { id: 1, logo: three_c_three, name: '3C3' },
    { id: 2, logo: cisco, name: 'Cisco' },
    { id: 3, logo: belden, name: 'Belden' },
    { id: 4, logo: digisol, name: 'Digisol' },
    { id: 5, logo: grandstream, name: 'Grandstream' },
    { id: 6, logo: hydai, name: 'Hydai' },
    { id: 7, logo: o_ld_systems_logo, name: 'LD Systems' },
    { id: 8, logo: AED_WEBSITE_DISTRIBUTION_BRANDS_QSC, name: 'QSC' },
    { id: 9, logo: apc, name: 'APC' },
    { id: 10, logo: lg, name: 'LG' },
    { id: 11, logo: Commscope_Logo, name: 'CommScope' },
    { id: 12, logo: Link_Logo_Blue_strap, name: 'D-Link' },
    { id: 13, logo: hikvision, name: 'Hikvision' },
    { id: 14, logo: HoneywellLogo, name: 'Honeywell' },
    { id: 15, logo: JBLLogo, name: 'JBL' },
    { id: 16, logo: logitech, name: 'Logitech' },
    { id: 17, logo: MATRIX, name: 'Matrix' },
    { id: 18, logo: netrack, name: 'NetRack' },
    { id: 19, logo: newline, name: 'NewLine' },
    { id: 20, logo: panasonic, name: 'Panasonic' },
    { id: 21, logo: ruckus, name: 'Ruckus' },
    { id: 22, logo: s1, name: 'S1' },
    { id: 23, logo: schneider, name: 'Schneider Electric' },
    { id: 24, logo: secureye, name: 'Secureye' },
    { id: 25, logo: tplink, name: 'TP-Link' },
    { id: 26, logo: ubiquiti, name: 'Ubiquiti' },
    { id: 27, logo: valrack, name: 'ValRack' },
    { id: 28, logo: vertex, name: 'Vertex' },
    { id: 29, logo: yeastar, name: 'Yeastar' }
  ], [])

  return (
    <div className="slider">
        <div className="slide-track">
            {partners.map(partner => (
              <div key={partner.id} className="slide">
                <img src={partner.logo} height="100" width="250" alt={partner.name} loading="lazy" />
              </div>
            ))}
        </div>
    </div>
  )
}

export default Partner
