import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import About from '../components/About'
import Skills from '../components/Skills'
import Projects from '../components/Projects'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import Lightbox from '../components/Lightbox'
import DynamicBackground from '../components/DynamicBackground'

const HomePage = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxData, setLightboxData] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (data, index = 0) => {
    setLightboxData(data)
    setLightboxIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxData(null)
    document.body.style.overflow = 'auto'
  }

  const navigateLightbox = (direction) => {
    if (!lightboxData) return
    const newIndex = direction === 'next'
      ? (lightboxIndex + 1) % lightboxData.length
      : (lightboxIndex - 1 + lightboxData.length) % lightboxData.length
    setLightboxIndex(newIndex)
  }

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      <DynamicBackground />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects openLightbox={openLightbox} />
        <Contact />
      </main>
      <Footer />
      <Lightbox
        isOpen={lightboxOpen}
        data={lightboxData}
        currentIndex={lightboxIndex}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
      />
    </>
  )
}

export default HomePage
