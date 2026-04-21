import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import {
  ExternalLink,
  Github,
  Layers,
  Sparkles
} from 'lucide-react'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const WEB_PROJECTS_ENDPOINT = `${API_BASE_URL}/api/webprojects`

const Projects = ({ openLightbox }) => {
  const [activeTab, setActiveTab] = useState('all')
  const [webProjects, setWebProjects] = useState([])
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  // Fetch web projects from backend
  useEffect(() => {
    const fetchWebProjects = async () => {
      try {
        console.log('Fetching projects from:', WEB_PROJECTS_ENDPOINT)
        const res = await fetch(WEB_PROJECTS_ENDPOINT)
        console.log('Response status:', res.status)
        const data = await res.json()
        console.log('Response data:', data)
        if (data.success) {
          console.log('Projects loaded:', data.projects)
          setWebProjects(data.projects)
        }
      } catch (error) {
        console.error('Failed to fetch web projects:', error)
      }
    }
    fetchWebProjects()
  }, [])

  // Design Projects Data (static for now - can be made dynamic later)
  const designProjects = [
    {
      id: 1,
      title: 'SynParagon',
      category: 'Brand Identity',
      image: 'https://via.placeholder.com/600x400/1a1a2e/00f5ff?text=SynParagon+Logo',
      description: 'Complete brand identity design including logo, color palette, and brand guidelines.',
      type: 'design'
    },
    {
      id: 2,
      title: 'CwidyGlam',
      category: 'Logo Design',
      image: 'https://via.placeholder.com/600x800/1a1a2e/a855f7?text=CwidyGlam',
      description: 'Elegant beauty brand logo with modern typography and feminine aesthetics.',
      type: 'design',
      tall: true
    },
    {
      id: 3,
      title: 'Love in Motion',
      category: 'Event Branding',
      image: 'https://via.placeholder.com/800x400/1a1a2e/ec4899?text=Love+in+Motion',
      description: 'Romantic event branding with dynamic typography and passionate color schemes.',
      type: 'design',
      wide: true
    }
  ]

  const tabs = [
    { id: 'all', label: 'All Work' },
    { id: 'design', label: 'Design' },
    { id: 'web', label: 'Web Apps' }
  ]

  const handleDesignClick = (index) => {
    const designItems = designProjects.map(p => ({
      image: p.image,
      title: p.title,
      category: p.category
    }))
    openLightbox(designItems, index)
  }

  return (
    <section id="projects" className="section" ref={ref}>
      <div className="section-container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-tag">Portfolio</span>
          <h2 className="section-title">Featured Projects</h2>
          <p className="section-description">
            A showcase of my work across development and design
          </p>
        </motion.div>

        {/* Project Tabs */}
        <motion.div
          className="projects-tabs"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`project-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Design Projects - Masonry Grid */}
        {(activeTab === 'all' || activeTab === 'design') && designProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-center mb-4" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
              <Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Graphic & Brand Design
            </h3>
            <div className="masonry-grid mb-4">
              {designProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  className={`masonry-item ${project.tall ? 'tall' : ''} ${project.wide ? 'wide' : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  onClick={() => handleDesignClick(index)}
                >
                  <img
                    src={project.image}
                    alt={project.name}
                    className="masonry-image"
                    loading="lazy"
                  />
                  <div className="masonry-overlay">
                    <h4 className="masonry-title">{project.name}</h4>
                    <span className="masonry-category">{project.category}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Web Application Projects - Device Mockup */}
        {(activeTab === 'all' || activeTab === 'web') && webProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-center mb-4" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
              <Layers size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Web Applications
            </h3>
            {webProjects.map((project) => {
              const projectName = project.name || project.title || 'Untitled Project'
              const projectTech = project.technologies || project.tech || []
              const projectLiveUrl = project.liveUrl || project.liveDemo || project.url
              const projectGithubUrl = project.githubUrl || project.github

              return (
              <motion.div
                key={project.id}
                className="glass-card device-mockup-card mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="device-mockup">
                  <div className="device-frame">
                    <div className="device-header">
                      <span className="device-dot red"></span>
                      <span className="device-dot yellow"></span>
                      <span className="device-dot green"></span>
                        <span className="device-url">{projectLiveUrl || 'localhost'}</span>
                    </div>
                    {project.image ? (
                      <img
                        src={project.image}
                          alt={projectName}
                        className="device-screen"
                        loading="lazy"
                      />
                    ) : (
                      <div className="device-screen" style={{
                        background: 'var(--color-bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-tertiary)'
                      }}>
                        <Layers size={48} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="project-info">
                  <h3 className="project-title">{projectName}</h3>
                  <p className="project-description">{project.description}</p>
                  {projectTech.length > 0 && (
                    <div className="project-tech">
                      {projectTech.map(t => (
                        <span key={t} className="tech-tag">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="project-links">
                    {projectLiveUrl && projectLiveUrl !== '#' && (
                      <a href={projectLiveUrl} className="btn-primary" target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={18} />
                        Live Demo
                      </a>
                    )}
                    {projectGithubUrl && projectGithubUrl !== '#' && (
                      <a href={projectGithubUrl} className="btn-secondary" target="_blank" rel="noopener noreferrer">
                        <Github size={18} />
                        View Code
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )})}
          </motion.div>
        )}

        {/* Empty state for web apps */}
        {activeTab === 'web' && webProjects.length === 0 && (
          <div className="text-center" style={{ padding: '4rem 2rem', color: 'var(--text-tertiary)' }}>
            <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No web projects yet. Add them from the admin dashboard.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Projects
