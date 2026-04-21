import { useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Github,
  Linkedin,
  Instagram,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { fetchApi } from '../lib/apiClient'

const Contact = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, success: false, error: null })

    try {
      const response = await fetchApi('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message')
      }

      setStatus({ loading: false, success: true, error: null })
      setFormData({ name: '', email: '', message: '' })

      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus(prev => ({ ...prev, success: false }))
      }, 5000)

    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        error: error.message || 'Something went wrong. Please try again.'
      })

      // Reset error message after 5 seconds
      setTimeout(() => {
        setStatus(prev => ({ ...prev, error: null }))
      }, 5000)
    }
  }

  const contactInfo = [
    {
      icon: <Mail size={24} />,
      label: 'Email',
      value: 'hello@igiegbabright.com'
    },
    {
      icon: <MapPin size={24} />,
      label: 'Location',
      value: 'Nigeria'
    },
    {
      icon: <Phone size={24} />,
      label: 'Phone',
      value: '+234 XXX XXX XXXX'
    }
  ]

  const socialLinks = [
    { icon: <Github size={20} />, href: 'https://github.com', label: 'GitHub' },
    { icon: <Linkedin size={20} />, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: <Instagram size={20} />, href: 'https://instagram.com', label: 'Instagram' }
  ]

  return (
    <section id="contact" className="section" ref={ref}>
      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Contact</span>
          <h2 className="section-title">Let's Work Together</h2>
          <p className="section-description">
            Have a project in mind? Let's discuss how we can bring your vision to life.
          </p>
        </motion.div>

        <div className="contact-grid">
          {/* Contact Info */}
          <motion.div
            className="glass-card contact-info"
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h3>Get In Touch</h3>
            <p>
              Whether you need a full-stack web application, a stunning brand identity,
              or technical tutoring, I'm here to help. Let's create something amazing together.
            </p>

            <div className="contact-details">
              {contactInfo.map((item, index) => (
                <div key={index} className="contact-item">
                  <div className="contact-icon">{item.icon}</div>
                  <div className="contact-item-text">
                    <span className="contact-label">{item.label}</span>
                    <span className="contact-value">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="social-links">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="glass-card contact-form-card"
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  className="form-textarea"
                  placeholder="Tell me about your project..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={5000}
                />
              </div>

              {status.success && (
                <motion.div
                  className="form-message success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CheckCircle size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
                  Thank you! Your message has been sent successfully.
                </motion.div>
              )}

              {status.error && (
                <motion.div
                  className="form-message error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
                  {status.error}
                </motion.div>
              )}

              <div className="form-submit">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={status.loading}
                >
                  {status.loading ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Contact
