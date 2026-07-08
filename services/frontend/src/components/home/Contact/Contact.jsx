import './Contact.css'
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiArrowUpRight, FiCheck, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'

const mapEmbed =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3318.8754976848287!2d89.6328027!3d27.4733788!2m3!1f0!2f0!3f0!2m3!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e19540ea5e0f95%3A0xdb30232881d3639a!2sBG%20Sales%20and%20Supplies!5e0!3m2!1sen!2sbt!4v1702028400000'

const Contact = () => {
  const reduceMotion = useReducedMotion()
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section className="home-contact" id="contact">
      <motion.div
        className="home-contact__statement"
        initial={reduceMotion ? false : { opacity: 0, y: 38 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <span>Start a conversation</span>
        <h2>Tell us what you’re building. We’ll help you make it work.</h2>

        <div className="home-contact__details">
          <a href="mailto:bgsales@outlook.com">
            <FiMail />
            <span><small>Email</small>bgsales@outlook.com</span>
          </a>
          <a href="tel:+97577208946">
            <FiPhone />
            <span><small>Call</small>+975 77208946 / 17171615</span>
          </a>
          <div>
            <FiMapPin />
            <span><small>Visit</small>Hongkong Market, Thimphu, Bhutan</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="home-contact__form-wrap"
        initial={reduceMotion ? false : { opacity: 0, y: 42 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        {submitted ? (
          <motion.div
            className="home-contact__success"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <i><FiCheck /></i>
            <span>Inquiry prepared</span>
            <h3>Thank you. We’ll be ready to connect this to the BG backend.</h3>
            <p>This is a temporary local confirmation while the submission API is being built.</p>
            <button type="button" onClick={() => setSubmitted(false)}>Send another inquiry</button>
          </motion.div>
        ) : (
          <form className="home-contact__form" onSubmit={onSubmit}>
            <div className="home-contact__form-heading">
              <span>Project inquiry · Preview</span>
              <p>Share the essentials. Our team can take it from there.</p>
            </div>
            <p className="home-contact__demo-note">
              Online submission is not active yet. This preview validates the form but does not send your details.
            </p>

            <div className="home-contact__fields">
              <label>
                <span>Name</span>
                <input name="name" type="text" placeholder="Your name" required />
              </label>
              <label>
                <span>Organization</span>
                <input name="organization" type="text" placeholder="Company or institution" />
              </label>
              <label>
                <span>Email or phone</span>
                <input name="contact" type="text" placeholder="How should we reach you?" required />
              </label>
              <label>
                <span>What do you need?</span>
                <select name="inquiryType" defaultValue="" required>
                  <option value="" disabled>Select an inquiry</option>
                  <option value="products">Products</option>
                  <option value="services">Services</option>
                  <option value="consultation">Project consultation</option>
                  <option value="quotation">Quotation</option>
                </select>
              </label>
              <label className="home-contact__message">
                <span>Short message</span>
                <textarea name="message" rows="4" placeholder="Tell us what you are planning..." required />
              </label>
            </div>

            <button className="home-contact__submit" type="submit">
              Prepare inquiry <FiArrowUpRight />
            </button>
          </form>
        )}
      </motion.div>

      <motion.a
        className="home-contact__map"
        href="https://www.google.com/maps/place/BG+Sales+and+Supplies/@27.4733788,89.6328027,17z"
        target="_blank"
        rel="noreferrer"
        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <iframe
          src={mapEmbed}
          title="BG Sales and Supplies location"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <span>Open in Google Maps <FiArrowUpRight /></span>
      </motion.a>
    </section>
  )
}

export default Contact
