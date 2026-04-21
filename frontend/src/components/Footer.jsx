import { Heart } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">Igiegba Bright</div>
        <p className="footer-text">
          Crafted with <Heart size={14} style={{ display: 'inline', color: '#ec4899', verticalAlign: 'middle' }} /> using React & Node.js
        </p>
        <p className="footer-text">
          &copy; {currentYear} All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
