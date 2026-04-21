import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const Lightbox = ({ isOpen, data, currentIndex, onClose, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      if (e.key === 'ArrowLeft') {
        onNavigate('prev')
      } else if (e.key === 'ArrowRight') {
        onNavigate('next')
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onNavigate, onClose])

  if (!data || data.length === 0) return null

  const currentItem = data[currentIndex]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="lightbox open"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="lightbox-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="lightbox-close"
              onClick={onClose}
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>

            {data.length > 1 && (
              <>
                <button
                  className="lightbox-nav lightbox-prev"
                  onClick={() => onNavigate('prev')}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  className="lightbox-nav lightbox-next"
                  onClick={() => onNavigate('next')}
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <motion.img
              key={currentIndex}
              src={currentItem.image}
              alt={currentItem.title}
              className="lightbox-image"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            />

            <div className="lightbox-info">
              <h3 className="lightbox-title">{currentItem.title}</h3>
              <p className="lightbox-category">{currentItem.category}</p>
              {data.length > 1 && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  {currentIndex + 1} / {data.length}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Lightbox
