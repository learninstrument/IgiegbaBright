import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

const ProjectSlideshow = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) return null

  const goToPrevious = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = (e) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const currentImage = images[currentIndex]

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#0f172a'
    }}>
      {/* Main Image */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '66.67%',
          overflow: 'hidden'
        }}
      >
        <img
          src={currentImage.url}
          alt={`${title} slide ${currentIndex + 1}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </motion.div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'backgroundColor 0.3s ease',
              zIndex: 2
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={goToNext}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'backgroundColor 0.3s ease',
              zIndex: 2
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Slide Counter & Dots */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2
        }}>
          {/* Dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: index === currentIndex ? '#667eea' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'backgroundColor 0.3s ease'
                }}
                title={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <span style={{
            color: 'white',
            fontSize: '12px',
            marginLeft: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  )
}

export default ProjectSlideshow
