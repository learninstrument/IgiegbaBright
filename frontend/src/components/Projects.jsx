import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import {
  ExternalLink,
  Github,
  Layers,
  Sparkles
} from 'lucide-react'
import { fetchApi } from '../lib/apiClient'
import { listFilesFromSupabase } from '../lib/supabaseClient'
import {
  graphicDesignProjects,
  brandingDesignProjects,
  webAppProjects
} from '../data/projectsData'

const Projects = ({ openLightbox }) => {
  const [activeTab, setActiveTab] = useState('all')
  const [apiWebProjects, setApiWebProjects] = useState([])
  const [apiDesignProjects, setApiDesignProjects] = useState([])
  const [apiBrandProjects, setApiBrandProjects] = useState([])
  const [projectFiles, setProjectFiles] = useState([])
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  const isImageFilename = (filename = '') => /\.(avif|jpe?g|png|gif|webp|svg)$/i.test(filename)

  const inferFileCategory = (filename = '') => {
    const normalized = filename.toLowerCase()
    if (normalized.includes('brand') || normalized.includes('logo') || normalized.includes('identity')) return 'branding'
    if (normalized.includes('web') || normalized.includes('app') || normalized.includes('site') || normalized.includes('ui')) return 'web'
    return 'graphic'
  }

  const toProjectTitle = (filename = '') => (
    filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Untitled Project'
  )

  const normalizeProjectKey = (project = {}) => {
    const name = project.name || project.title || ''
    const image = project.image || project.image_url || ''
    const live = project.liveUrl || project.live_url || project.liveDemo || project.url || ''
    return `${project.id || ''}-${name}-${image}-${live}`.toLowerCase()
  }

  const dedupeProjects = (projects) => projects.filter((project, index, allProjects) => (
    index === allProjects.findIndex(item => normalizeProjectKey(item) === normalizeProjectKey(project))
  ))

  // Fetch web projects and uploaded project files
  useEffect(() => {
    const fetchWebProjects = async () => {
      try {
        const res = await fetchApi('/webprojects')
        const data = await res.json()
        if (res.ok && data.success) {
          setApiWebProjects(data.projects || [])
        } else {
          setApiWebProjects([])
        }
      } catch (error) {
        console.error('Failed to fetch web projects:', error)
        setApiWebProjects([])
      }
    }

    const fetchDesignProjects = async () => {
      try {
        const res = await fetchApi('/design-projects')
        const data = await res.json()
        if (res.ok && data.success) {
          setApiDesignProjects(data.projects || [])
        } else {
          setApiDesignProjects([])
        }
      } catch (error) {
        console.error('Failed to fetch design projects:', error)
        setApiDesignProjects([])
      }
    }

    const fetchBrandProjects = async () => {
      try {
        const res = await fetchApi('/brand-projects')
        const data = await res.json()
        if (res.ok && data.success) {
          setApiBrandProjects(data.projects || [])
        } else {
          setApiBrandProjects([])
        }
      } catch (error) {
        console.error('Failed to fetch brand projects:', error)
        setApiBrandProjects([])
      }
    }

    const fetchProjectFiles = async () => {
      try {
        const files = await listFilesFromSupabase('project')
        setProjectFiles(files || [])
      } catch (error) {
        console.error('Failed to fetch project files:', error)
        setProjectFiles([])
      }
    }

    fetchWebProjects()
    fetchDesignProjects()
    fetchBrandProjects()
    fetchProjectFiles()
  }, [])

  const graphicFileProjects = projectFiles
    .filter(file => isImageFilename(file.filename) && inferFileCategory(file.filename) === 'graphic')
    .map(file => ({
      id: `graphic-file-${file.filename}`,
      title: toProjectTitle(file.filename),
      category: 'Graphic Design',
      image: file.url,
      description: 'Uploaded project file'
    }))

  const brandingFileProjects = projectFiles
    .filter(file => isImageFilename(file.filename) && inferFileCategory(file.filename) === 'branding')
    .map(file => ({
      id: `branding-file-${file.filename}`,
      title: toProjectTitle(file.filename),
      category: 'Branding Design',
      image: file.url,
      description: 'Uploaded project file'
    }))

  const webFileProjects = projectFiles
    .filter(file => inferFileCategory(file.filename) === 'web')
    .map(file => ({
      id: `web-file-${file.filename}`,
      name: toProjectTitle(file.filename),
      description: 'Uploaded project file',
      image: isImageFilename(file.filename) ? file.url : '',
      technologies: []
    }))

  // Transform API design projects into display format
  const apiDesignProjectsTransformed = apiDesignProjects.map(project => ({
    id: `api-graphic-${project.id}`,
    title: project.name,
    category: 'Graphic Design',
    image: project.images?.[0]?.url || '',
    description: project.description,
    images: project.images || [],
    wide: true
  }))

  // Transform API brand projects into display format
  const apiBrandProjectsTransformed = apiBrandProjects.map(project => ({
    id: `api-brand-${project.id}`,
    title: project.name,
    category: 'Branding Design',
    image: project.images?.[0]?.url || '',
    description: project.description,
    images: project.images || []
  }))

  const featuredGraphicProjects = dedupeProjects([...graphicDesignProjects, ...graphicFileProjects, ...apiDesignProjectsTransformed])
  const featuredBrandingProjects = dedupeProjects([...brandingDesignProjects, ...brandingFileProjects, ...apiBrandProjectsTransformed])
  const fallbackBrandingProjects = dedupeProjects([...brandingDesignProjects, ...brandingFileProjects])
  const featuredWebProjects = dedupeProjects([...webAppProjects, ...webFileProjects, ...apiWebProjects])

  const tabs = [
    { id: 'all', label: 'All Work' },
    { id: 'graphic', label: 'Graphic Design' },
    { id: 'branding', label: 'Branding Design' },
    { id: 'web', label: 'Web Apps' }
  ]

  const handleDesignClick = (collection, index) => {
    const designItems = collection.map(p => ({
      image: p.image,
      title: p.title || p.name || 'Untitled Project',
      category: p.category || 'Design'
    }))
    openLightbox(designItems, index)
  }

  const openBrandProjectGallery = (project, startIndex = 0) => {
    const slides = (project.images || [])
      .filter(image => image?.url)
      .map((image, index) => ({
        image: image.url,
        title: `${project.title || 'Brand Identity'} - Slide ${index + 1}`,
        category: 'Brand Identity'
      }))

    if (slides.length > 0) {
      openLightbox(slides, startIndex)
    }
  }

  const normalizeTechnologies = (project) => {
    const technologies = project.technologies || project.tech || project.tech_stack || []
    if (Array.isArray(technologies)) return technologies
    if (typeof technologies === 'string') {
      return technologies.split(',').map(item => item.trim()).filter(Boolean)
    }
    return []
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

        {/* Graphic Design Projects */}
        {(activeTab === 'all' || activeTab === 'graphic') && featuredGraphicProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-center mb-4" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
              <Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Graphic Design
            </h3>
            <div className="masonry-grid mb-4">
              {featuredGraphicProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  className={`masonry-item ${project.tall ? 'tall' : ''} ${project.wide ? 'wide' : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  onClick={() => handleDesignClick(featuredGraphicProjects, index)}
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="masonry-image"
                    loading="lazy"
                  />
                   <div className="masonry-overlay">
                     <h4 className="masonry-title">{project.title}</h4>
                     <span className="masonry-category">{project.category}</span>
                     {project.description && <p className="masonry-description">{project.description}</p>}
                   </div>
                 </motion.div>
               ))}
            </div>
          </motion.div>
        )}

        {/* Branding Design Projects */}
        {(activeTab === 'all' || activeTab === 'branding') && featuredBrandingProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-center mb-4" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
              <Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Branding Design
            </h3>
            {apiBrandProjectsTransformed.length > 0 && (
              <div className="brand-gallery-projects">
                {apiBrandProjectsTransformed.map((project, projectIndex) => (
                  <motion.div
                    key={project.id}
                    className="glass-card-static brand-gallery-project"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: projectIndex * 0.08, duration: 0.5 }}
                  >
                    <h4 style={{ marginTop: 0, marginBottom: '10px' }}>{project.title}</h4>
                    <p style={{ marginTop: 0, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                      {project.description || 'No description yet.'}
                    </p>

                    {project.images && project.images.length > 0 ? (
                      <div className="brand-gallery-grid">
                        {project.images.map((image, slideIndex) => (
                          <button
                            key={image.id || `${project.id}-slide-${slideIndex}`}
                            type="button"
                            className="brand-gallery-item"
                            onClick={() => openBrandProjectGallery(project, slideIndex)}
                          >
                            <img src={image.url} alt={`${project.title} slide ${slideIndex + 1}`} loading="lazy" />
                            <span>Slide {slideIndex + 1}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>No slides uploaded yet.</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Static fallback branding projects */}
            {fallbackBrandingProjects.length > 0 && (
               <div className="masonry-grid mb-4">
                {fallbackBrandingProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    className={`masonry-item ${project.tall ? 'tall' : ''} ${project.wide ? 'wide' : ''}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    onClick={() => handleDesignClick([project], 0)}
                  >
                    <img
                      src={project.image}
                      alt={project.title}
                      className="masonry-image"
                      loading="lazy"
                    />
                    <div className="masonry-overlay">
                      <h4 className="masonry-title">{project.title}</h4>
                      <span className="masonry-category">{project.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Web Application Projects - Device Mockup */}
        {(activeTab === 'all' || activeTab === 'web') && featuredWebProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-center mb-4" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
              <Layers size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Web Applications
            </h3>
            {featuredWebProjects.map((project) => {
              const projectName = project.name || project.title || 'Untitled Project'
              const projectTech = normalizeTechnologies(project)
              const projectLiveUrl = project.liveUrl || project.live_url || project.liveDemo || project.url
              const projectGithubUrl = project.githubUrl || project.github_url || project.github
              const projectImage = project.image || project.image_url

              return (
              <motion.div
                key={project.id || projectName}
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
                    {projectImage ? (
                      <img
                        src={projectImage}
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

        {/* Empty state for graphic design */}
        {activeTab === 'graphic' && featuredGraphicProjects.length === 0 && (
          <div className="text-center" style={{ padding: '4rem 2rem', color: 'var(--text-tertiary)' }}>
            <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No graphic design projects yet.</p>
          </div>
        )}

        {/* Empty state for branding design */}
        {activeTab === 'branding' && featuredBrandingProjects.length === 0 && (
          <div className="text-center" style={{ padding: '4rem 2rem', color: 'var(--text-tertiary)' }}>
            <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No branding design projects yet.</p>
          </div>
        )}

        {/* Empty state for web apps */}
        {activeTab === 'web' && featuredWebProjects.length === 0 && (
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
