import './Contact.css'
import { motion } from 'framer-motion'
import mail_icon from '../../../assets/mail-icon.png'
import phone_icon from '../../../assets/phone-icon.png'
import location_icon from '../../../assets/location-icon.png'
import { useState } from 'react'

const Contact = () => {
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setResult("Sending...");
        const formData = new FormData(event.target);
    
        formData.append("access_key", "cead1ec0-4ac6-47cb-9213-921cd8a577cd");
    
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData
        });
    
        const data = await response.json();
        setLoading(false);
    
        if (data.success) {
          setResult("Message sent successfully! We'll be in touch soon.");
          event.target.reset();
          setTimeout(() => setResult(""), 5000);
        } else {
          console.log("Error", data);
          setResult(data.message || "Failed to send message. Please try again.");
        }
    };

    const contactInfo = [
      { icon: mail_icon, label: "Email", value: "bgsales@outlook.com" },
      { icon: phone_icon, label: "Phone", value: "+975 77208946 / +975 17171615" },
      { icon: location_icon, label: "Address", value: "Hongkong Market, Opposite to DGM, MOENR office, Thimphu, Bhutan" }
    ]

    const mapLink = "https://www.google.com/maps/place/BG+Sales+and+Supplies/@27.4733788,89.6328027,17z/data=!3m1!4b1!4m6!3m5!1s0x39e19540ea5e0f95:0xdb30232881d3639a!8m2!3d27.4733788!4d89.6353776!16s%2Fg%2F11vx_yjp9j?entry=ttu"

    const leftVariants = {
      hidden: { opacity: 0, x: -30 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } }
    }

    const rightVariants = {
      hidden: { opacity: 0, x: 30 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } }
    }

    return (
      <section className='section section--spacious' id='contact'>
        <div className='contact-container'>
          <motion.div 
            className="contact-info"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={leftVariants}
          >
            <div className='contact-header'>
              <h2 className='h2'>Get in Touch</h2>
              <p>
                We'd love to hear from you. Whether you have questions about our services 
                or need a custom solution, our team is ready to help. Reach out anytime—we're here for you.
              </p>
            </div>

            <div className='contact-details'>
              {contactInfo.map((info, index) => (
                <div key={index} className='contact-item'>
                  <div className='contact-icon'>
                    <img src={info.icon} alt={info.label} />
                  </div>
                  <div className='contact-text'>
                    <h4>{info.label}</h4>
                    <p>{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Location Map */}
            <motion.div 
              className="location-map-container"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: false, amount: 0.3 }}
            >
              <div className="map-wrapper">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3318.8754976848287!2d89.6328027!3d27.4733788!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e19540ea5e0f95%3A0xdb30232881d3639a!2sBG%20Sales%20and%20Supplies!5e0!3m2!1sen!2sbt!4v1702028400000"
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: '12px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="BG Sales and Supplies Location"
                ></iframe>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="contact-form-wrapper"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={rightVariants}
          >
            <form onSubmit={onSubmit} className='contact-form'>
              <div className='form-group'>
                <label htmlFor='name'>Your Name</label>
                <input 
                  type="text" 
                  id='name'
                  name='name' 
                  placeholder='John Doe' 
                  required
                />
              </div>

              <div className='form-group'>
                <label htmlFor='phone'>Phone Number</label>
                <input 
                  type="tel" 
                  id='phone'
                  name='phone' 
                  placeholder='+975 XXXX XXXX' 
                  required
                />
              </div>

              <div className='form-group'>
                <label htmlFor='message'>Your Message</label>
                <textarea 
                  id='message'
                  name="message" 
                  rows="6" 
                  placeholder='Tell us about your project or inquiry...' 
                  required
                ></textarea>
              </div>

              <button type='submit' className='btn btn-primary btn-lg' disabled={loading}>
                {loading ? "Sending..." : "Send Message"}
              </button>

              {result && (
                <div className={`form-message ${result.includes("success") || result.includes("successfully") ? "success" : "error"}`}>
                  {result}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </section>
    )
}

export default Contact
