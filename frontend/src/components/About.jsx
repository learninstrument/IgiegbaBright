import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Code2, Palette, Lightbulb, Users } from 'lucide-react'
import { listFilesFromSupabase } from '../lib/supabaseClient'

const About = () => {
  const [profileImage, setProfileImage] = useState(null)
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  // Fetch profile picture from backend
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const files = await listFilesFromSupabase('profile')
        if (files && files.length > 0) {
          // Get the most recent profile image
          const latestImage = files[files.length - 1]
          setProfileImage(latestImage.url)
        }
      } catch (error) {
        console.log('No profile image found')
      }
    }
    fetchProfileImage()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  }

  const stats = [
    { number: '3+', label: 'Years Experience' },
    { number: '20+', label: 'Projects Completed' },
    { number: '15+', label: 'Happy Clients' }
  ]

  return (
    <section id="about" className="section" ref={ref}>
      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">About Me</span>
          <h2 className="section-title">The Creative Technologist</h2>
          <p className="section-description">
            Where logical precision meets visual excellence
          </p>
        </motion.div>

        <motion.div
          className="about-content"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div className="about-image-container" variants={itemVariants}>
            <div className="about-image-wrapper">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Igiegba Bright"
                  className="about-image"
                />
              ) : (
                <div
                  className="about-image"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                    fontSize: '4rem',
                    color: 'var(--color-accent-cyan)'
                  }}
                >
                  IB
                </div>
              )}
            </div>
            <div className="about-stats">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="about-text" variants={itemVariants}>
            <h3>A Dual-Threat Professional</h3>
            <p>
              I'm Igiegba Bright, a software developer and creative designer with a unique blend
              of technical expertise and creative vision. I don't just write code—I architect
              digital experiences that are both functionally robust and visually stunning.
            </p>
            <p>
              On the <strong className="text-cyan">development side</strong>, I build scalable
              web applications using React, Node.js, and Express. I understand REST APIs,
              database design, and the importance of clean, maintainable code architecture.
            </p>
            <p>
              On the <strong className="text-purple">design side</strong>, I craft brand
              identities, marketing materials, and user interfaces using the Adobe Creative Suite
              and Figma. I believe that great software deserves equally great aesthetics.
            </p>
            <p>
              Beyond building and designing, I'm passionate about <strong>technical education</strong>.
              I tutor aspiring developers and designers, helping them bridge the same gap I've
              mastered—turning technical concepts into tangible, beautiful solutions.
            </p>

            <div className="about-highlight">
              <div className="highlight-item">
                <Code2 size={20} />
                <span>Full-Stack Development</span>
              </div>
              <div className="highlight-item">
                <Palette size={20} />
                <span>Brand & UI Design</span>
              </div>
              <div className="highlight-item">
                <Lightbulb size={20} />
                <span>Creative Solutions</span>
              </div>
              <div className="highlight-item">
                <Users size={20} />
                <span>Technical Tutoring</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
