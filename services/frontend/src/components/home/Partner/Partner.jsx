import './Partner.css'
import threeCThree from '../../../assets/partners/3C3.png'
import cisco from '../../../assets/partners/cisco.png'
import belden from '../../../assets/partners/belden.jpeg'
import digisol from '../../../assets/partners/digisol.png'
import grandstream from '../../../assets/partners/grandstream.png'
import hydai from '../../../assets/partners/hydai.jpg'
import ldSystems from '../../../assets/partners/0_ld_systems_logo.jpg'
import qsc from '../../../assets/partners/AED_WEBSITE_DISTRIBUTION_BRANDS_QSC Live Sound_5.jpg'
import apc from '../../../assets/partners/APC.png'
import lg from '../../../assets/partners/lg.jpg'
import commscope from '../../../assets/partners/Commscope_Logo.jpg'
import dlink from '../../../assets/partners/D-Link_Logo_Blue_strap.jpg'
import hikvision from '../../../assets/partners/hikvision.png'
import honeywell from '../../../assets/partners/Honeywell-Logo.png'
import jbl from '../../../assets/partners/JBL-Logo.png'
import logitech from '../../../assets/partners/logitech.png'
import matrix from '../../../assets/partners/MATRIX.jpg'
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

const partners = [
  { logo: cisco, name: 'Cisco' },
  { logo: commscope, name: 'CommScope' },
  { logo: belden, name: 'Belden' },
  { logo: ruckus, name: 'Ruckus' },
  { logo: ubiquiti, name: 'Ubiquiti' },
  { logo: dlink, name: 'D-Link' },
  { logo: tplink, name: 'TP-Link' },
  { logo: digisol, name: 'Digisol' },
  { logo: grandstream, name: 'Grandstream' },
  { logo: yeastar, name: 'Yeastar' },
  { logo: apc, name: 'APC' },
  { logo: schneider, name: 'Schneider Electric' },
  { logo: hikvision, name: 'Hikvision' },
  { logo: honeywell, name: 'Honeywell' },
  { logo: secureye, name: 'Secureye' },
  { logo: matrix, name: 'Matrix' },
  { logo: lg, name: 'LG' },
  { logo: panasonic, name: 'Panasonic' },
  { logo: logitech, name: 'Logitech' },
  { logo: jbl, name: 'JBL' },
  { logo: qsc, name: 'QSC' },
  { logo: ldSystems, name: 'LD Systems' },
  { logo: newline, name: 'NewLine' },
  { logo: netrack, name: 'NetRack' },
  { logo: valrack, name: 'ValRack' },
  { logo: vertex, name: 'Vertex' },
  { logo: s1, name: 'S1' },
  { logo: threeCThree, name: '3C3' },
  { logo: hydai, name: 'Hydai' },
]

const PartnerRow = ({ items, reverse = false }) => {
  const repeatedItems = [...items, ...items]

  return (
    <div className={`partner-ribbon ${reverse ? 'is-reverse' : ''}`}>
      <div className="partner-ribbon__track">
        {repeatedItems.map((partner, index) => (
          <div className="partner-logo" key={`${partner.name}-${index}`}>
            <img src={partner.logo} alt={partner.name} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  )
}

const Partner = () => {
  const midpoint = Math.ceil(partners.length / 2)

  return (
    <div className="partner-ribbons">
      <PartnerRow items={partners.slice(0, midpoint)} />
      <PartnerRow items={partners.slice(midpoint)} reverse />
    </div>
  )
}

export default Partner
