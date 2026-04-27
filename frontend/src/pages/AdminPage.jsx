import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Image,
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Layers,
  Code2,
  Eye,
  ExternalLink,
  Github,
  Edit3,
  Brush,
  Palette
} from 'lucide-react'
import { uploadToSupabaseDirect, deleteFromSupabaseDirect, listFilesFromSupabase } from '../lib/supabaseClient'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const API_URL = `${API_BASE_URL}/api`
const MAX_BRAND_SLIDES = 15
const isImageFilename = (filename = '') => /\.(avif|jpe?g|png|gif|webp|svg)$/i.test(filename)
const inferProjectFileCategory = (filename = '') => {
  const normalized = filename.toLowerCase()
  if (normalized.includes('brand') || normalized.includes('logo') || normalized.includes('identity')) return 'branding'
  if (normalized.includes('web') || normalized.includes('app') || normalized.includes('site') || normalized.includes('ui')) return 'web'
  return 'graphic'
}

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('projects')
  const [profileFiles, setProfileFiles] = useState([])
  const [webProjects, setWebProjects] = useState([])
  const [designProjects, setDesignProjects] = useState([])
  const [brandProjects, setBrandProjects] = useState([])
  const [legacyGraphicFiles, setLegacyGraphicFiles] = useState([])

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [editingProject, setEditingProject] = useState(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    image: '',
    liveUrl: '',
    githubUrl: '',
    technologies: ''
  })

  const [editingDesignProject, setEditingDesignProject] = useState(null)
  const [showDesignProjectForm, setShowDesignProjectForm] = useState(false)
  const [designProjectForm, setDesignProjectForm] = useState({
    name: '',
    description: ''
  })
  const [selectedDesignProject, setSelectedDesignProject] = useState(null)

  const [editingBrandProject, setEditingBrandProject] = useState(null)
  const [showBrandProjectForm, setShowBrandProjectForm] = useState(false)
  const [brandProjectForm, setBrandProjectForm] = useState({
    name: '',
    description: ''
  })
  const [selectedBrandProject, setSelectedBrandProject] = useState(null)

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const fetchProfileFiles = async () => {
    try {
      const files = await listFilesFromSupabase('profile')
      setProfileFiles(files || [])
    } catch (error) {
      console.error('Failed to fetch profile files:', error)
      setProfileFiles([])
    }
  }

  const fetchWebProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/webprojects`)
      const data = await res.json()
      if (data.success) {
        setWebProjects(data.projects || [])
      } else {
        setWebProjects([])
      }
    } catch (error) {
      console.error('Failed to fetch web projects:', error)
      setWebProjects([])
    }
  }

  const fetchDesignProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/design-projects`)
      const data = await res.json()
      if (data.success) {
        setDesignProjects(data.projects || [])
      } else {
        setDesignProjects([])
      }
    } catch (error) {
      console.error('Failed to fetch design projects:', error)
      setDesignProjects([])
    }
  }

  const fetchBrandProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/brand-projects`)
      const data = await res.json()
      if (data.success) {
        setBrandProjects(data.projects || [])
      } else {
        setBrandProjects([])
      }
    } catch (error) {
      console.error('Failed to fetch brand projects:', error)
      setBrandProjects([])
    }
  }

  const fetchLegacyGraphicFiles = async () => {
    try {
      const files = await listFilesFromSupabase('project')
      const graphicFiles = (files || []).filter((file) => (
        isImageFilename(file.filename) && inferProjectFileCategory(file.filename) === 'graphic'
      ))
      setLegacyGraphicFiles(graphicFiles)
    } catch (error) {
      console.error('Failed to fetch legacy graphic files:', error)
      setLegacyGraphicFiles([])
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const files = await listFilesFromSupabase('profile')
        setProfileFiles(files || [])
      } catch (error) {
        console.error('Failed to fetch profile files:', error)
        setProfileFiles([])
      }

      try {
        const webRes = await fetch(`${API_URL}/webprojects`)
        const webData = await webRes.json()
        setWebProjects(webData.success ? (webData.projects || []) : [])
      } catch (error) {
        console.error('Failed to fetch web projects:', error)
        setWebProjects([])
      }

      try {
        const designRes = await fetch(`${API_URL}/design-projects`)
        const designData = await designRes.json()
        setDesignProjects(designData.success ? (designData.projects || []) : [])
      } catch (error) {
        console.error('Failed to fetch design projects:', error)
        setDesignProjects([])
      }

      try {
        const brandRes = await fetch(`${API_URL}/brand-projects`)
        const brandData = await brandRes.json()
        setBrandProjects(brandData.success ? (brandData.projects || []) : [])
      } catch (error) {
        console.error('Failed to fetch brand projects:', error)
        setBrandProjects([])
      }

      try {
        const files = await listFilesFromSupabase('project')
        const graphicFiles = (files || []).filter((file) => (
          isImageFilename(file.filename) && inferProjectFileCategory(file.filename) === 'graphic'
        ))
        setLegacyGraphicFiles(graphicFiles)
      } catch (error) {
        console.error('Failed to fetch legacy graphic files:', error)
        setLegacyGraphicFiles([])
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (!selectedDesignProject) return
    const freshProject = designProjects.find(project => project.id === selectedDesignProject.id)
    setSelectedDesignProject(freshProject || null)
  }, [designProjects, selectedDesignProject])

  useEffect(() => {
    if (!selectedBrandProject) return
    const freshProject = brandProjects.find(project => project.id === selectedBrandProject.id)
    setSelectedBrandProject(freshProject || null)
  }, [brandProjects, selectedBrandProject])

  const onProfileDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    try {
      const [file] = acceptedFiles
      const result = await uploadToSupabaseDirect(file, 'profile')
      if (!result.success) {
        showMessage('error', `Upload failed: ${result.error}`)
        setIsUploading(false)
        return
      }

      showMessage('success', `Profile uploaded: ${file.name}`)
      fetchProfileFiles()
    } catch (error) {
      console.error('Profile upload error:', error)
      showMessage('error', 'Upload failed. Please try again.')
    }
    setIsUploading(false)
  }

  const deleteProfileFile = async (filename) => {
    if (!confirm('Are you sure you want to delete this profile picture?')) return

    try {
      const result = await deleteFromSupabaseDirect(filename, 'profile')
      if (result.success) {
        showMessage('success', 'Profile picture deleted')
        fetchProfileFiles()
      } else {
        showMessage('error', result.error || 'Failed to delete profile picture')
      }
    } catch (error) {
      console.error('Profile delete error:', error)
      showMessage('error', 'Failed to delete profile picture')
    }
  }

  const deleteLegacyGraphicFile = async (filename) => {
    if (!confirm('Are you sure you want to delete this uploaded graphic file?')) return

    try {
      const result = await deleteFromSupabaseDirect(filename, 'project')
      if (result.success) {
        showMessage('success', 'Uploaded graphic file deleted')
        fetchLegacyGraphicFiles()
      } else {
        showMessage('error', result.error || 'Failed to delete uploaded graphic file')
      }
    } catch (error) {
      console.error('Legacy file delete error:', error)
      showMessage('error', 'Failed to delete uploaded graphic file')
    }
  }

  const copyFileUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      showMessage('success', 'URL copied!')
    } catch (error) {
      console.error('Clipboard copy error:', error)
      showMessage('error', 'Failed to copy URL')
    }
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const technologiesArray = projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean)

    try {
      const url = editingProject
        ? `${API_URL}/webprojects/${editingProject.id}`
        : `${API_URL}/webprojects`

      const res = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectForm.title,
          description: projectForm.description,
          image: projectForm.image,
          liveUrl: projectForm.liveUrl,
          githubUrl: projectForm.githubUrl,
          technologies: technologiesArray
        })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', editingProject ? 'Web app updated!' : 'Web app added!')
        fetchWebProjects()
        resetProjectForm()
      } else {
        showMessage('error', data.message || 'Failed to save web app')
      }
    } catch (error) {
      console.error('Web app save error:', error)
      showMessage('error', 'Failed to save web app')
    }
    setIsSaving(false)
  }

  const editProject = (project) => {
    setEditingProject(project)
    setProjectForm({
      title: project.name || project.title || '',
      description: project.description || '',
      image: project.image || '',
      liveUrl: project.liveUrl || project.liveDemo || project.url || '',
      githubUrl: project.githubUrl || project.github || '',
      technologies: Array.isArray(project.technologies)
        ? project.technologies.join(', ')
        : (Array.isArray(project.tech) ? project.tech.join(', ') : '')
    })
    setShowProjectForm(true)
  }

  const deleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this web app project?')) return
    try {
      const res = await fetch(`${API_URL}/webprojects/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Web app project deleted')
        fetchWebProjects()
      } else {
        showMessage('error', data.message || 'Failed to delete web app project')
      }
    } catch (error) {
      console.error('Web app delete error:', error)
      showMessage('error', 'Failed to delete web app project')
    }
  }

  const resetProjectForm = () => {
    setProjectForm({ title: '', description: '', image: '', liveUrl: '', githubUrl: '', technologies: '' })
    setEditingProject(null)
    setShowProjectForm(false)
  }

  const openCreateDesignProjectForm = () => {
    setEditingDesignProject(null)
    setDesignProjectForm({ name: '', description: '' })
    setShowDesignProjectForm(true)
  }

  const openEditDesignProjectForm = (project) => {
    setEditingDesignProject(project)
    setDesignProjectForm({
      name: project.name || '',
      description: project.description || ''
    })
    setShowDesignProjectForm(true)
  }

  const resetDesignProjectForm = () => {
    setDesignProjectForm({ name: '', description: '' })
    setEditingDesignProject(null)
    setShowDesignProjectForm(false)
  }

  const handleDesignProjectSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingDesignProject
        ? `${API_URL}/design-projects/${editingDesignProject.id}`
        : `${API_URL}/design-projects`

      const res = await fetch(url, {
        method: editingDesignProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designProjectForm.name,
          description: designProjectForm.description,
          images: editingDesignProject?.images || []
        })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', editingDesignProject ? 'Graphic design project updated!' : 'Graphic design project created!')
        fetchDesignProjects()
        resetDesignProjectForm()
      } else {
        showMessage('error', data.message || 'Failed to save graphic design project')
      }
    } catch (error) {
      console.error('Design project save error:', error)
      showMessage('error', 'Failed to save graphic design project')
    }
    setIsSaving(false)
  }

  const handleAddDesignImage = async (file) => {
    if (!selectedDesignProject) {
      showMessage('error', 'Please select a graphic design project first')
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadToSupabaseDirect(file, 'design')
      if (!result.success) {
        showMessage('error', `Upload failed: ${result.error}`)
        setIsUploading(false)
        return
      }

      const updatedImages = [...(selectedDesignProject.images || []), { id: Date.now().toString(), url: result.url }]
      const res = await fetch(`${API_URL}/design-projects/${selectedDesignProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedDesignProject, images: updatedImages })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Graphic design image added!')
        fetchDesignProjects()
        setSelectedDesignProject(data.project)
      } else {
        showMessage('error', data.message || 'Failed to add image')
      }
    } catch (error) {
      console.error('Design image add error:', error)
      showMessage('error', 'Failed to add image')
    }
    setIsUploading(false)
  }

  const deleteDesignProject = async (id) => {
    if (!confirm('Are you sure you want to delete this graphic design project?')) return
    try {
      const res = await fetch(`${API_URL}/design-projects/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Graphic design project deleted')
        fetchDesignProjects()
        if (selectedDesignProject?.id === id) {
          setSelectedDesignProject(null)
        }
      } else {
        showMessage('error', data.message || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Design project delete error:', error)
      showMessage('error', 'Failed to delete project')
    }
  }

  const deleteDesignImage = async (projectId, imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    try {
      const project = designProjects.find(item => item.id === projectId)
      if (!project) {
        showMessage('error', 'Project not found')
        return
      }

      const updatedImages = (project.images || []).filter(img => img.id !== imageId)
      const res = await fetch(`${API_URL}/design-projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, images: updatedImages })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Image deleted')
        fetchDesignProjects()
        setSelectedDesignProject(data.project)
      } else {
        showMessage('error', data.message || 'Failed to delete image')
      }
    } catch (error) {
      console.error('Design image delete error:', error)
      showMessage('error', 'Failed to delete image')
    }
  }

  const openCreateBrandProjectForm = () => {
    setEditingBrandProject(null)
    setBrandProjectForm({ name: '', description: '' })
    setShowBrandProjectForm(true)
  }

  const openEditBrandProjectForm = (project) => {
    setEditingBrandProject(project)
    setBrandProjectForm({
      name: project.name || '',
      description: project.description || ''
    })
    setShowBrandProjectForm(true)
  }

  const resetBrandProjectForm = () => {
    setBrandProjectForm({ name: '', description: '' })
    setEditingBrandProject(null)
    setShowBrandProjectForm(false)
  }

  const handleBrandProjectSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingBrandProject
        ? `${API_URL}/brand-projects/${editingBrandProject.id}`
        : `${API_URL}/brand-projects`

      const res = await fetch(url, {
        method: editingBrandProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandProjectForm.name,
          description: brandProjectForm.description,
          images: editingBrandProject?.images || []
        })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', editingBrandProject ? 'Brand identity project updated!' : 'Brand identity project created!')
        fetchBrandProjects()
        resetBrandProjectForm()
      } else {
        showMessage('error', data.message || 'Failed to save brand identity project')
      }
    } catch (error) {
      console.error('Brand project save error:', error)
      showMessage('error', 'Failed to save brand identity project')
    }
    setIsSaving(false)
  }

  const handleAddBrandImage = async (file) => {
    if (!selectedBrandProject) {
      showMessage('error', 'Please select a brand identity project first')
      return
    }

    const currentSlides = selectedBrandProject.images?.length || 0
    if (currentSlides >= MAX_BRAND_SLIDES) {
      showMessage('error', `This project already has ${MAX_BRAND_SLIDES} slides`)
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadToSupabaseDirect(file, 'brand')
      if (!result.success) {
        showMessage('error', `Upload failed: ${result.error}`)
        setIsUploading(false)
        return
      }

      const updatedImages = [...(selectedBrandProject.images || []), { id: Date.now().toString(), url: result.url }]
      const res = await fetch(`${API_URL}/brand-projects/${selectedBrandProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedBrandProject, images: updatedImages })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', `Slide added (${updatedImages.length}/${MAX_BRAND_SLIDES})`)
        fetchBrandProjects()
        setSelectedBrandProject(data.project)
      } else {
        showMessage('error', data.message || 'Failed to add slide')
      }
    } catch (error) {
      console.error('Brand slide add error:', error)
      showMessage('error', 'Failed to add slide')
    }
    setIsUploading(false)
  }

  const deleteBrandProject = async (id) => {
    if (!confirm('Are you sure you want to delete this brand identity project?')) return
    try {
      const res = await fetch(`${API_URL}/brand-projects/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Brand identity project deleted')
        fetchBrandProjects()
        if (selectedBrandProject?.id === id) {
          setSelectedBrandProject(null)
        }
      } else {
        showMessage('error', data.message || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Brand project delete error:', error)
      showMessage('error', 'Failed to delete project')
    }
  }

  const deleteBrandImage = async (projectId, imageId) => {
    if (!confirm('Are you sure you want to delete this slide?')) return
    try {
      const project = brandProjects.find(item => item.id === projectId)
      if (!project) {
        showMessage('error', 'Project not found')
        return
      }

      const updatedImages = (project.images || []).filter(img => img.id !== imageId)
      const res = await fetch(`${API_URL}/brand-projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, images: updatedImages })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Slide deleted')
        fetchBrandProjects()
        setSelectedBrandProject(data.project)
      } else {
        showMessage('error', data.message || 'Failed to delete slide')
      }
    } catch (error) {
      console.error('Brand slide delete error:', error)
      showMessage('error', 'Failed to delete slide')
    }
  }

  const { getRootProps: getProfileRootProps, getInputProps: getProfileInputProps, isDragActive: isProfileDragActive } = useDropzone({
    onDrop: onProfileDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1
  })

  const { getRootProps: getDesignRootProps, getInputProps: getDesignInputProps, isDragActive: isDesignDragActive } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0 && selectedDesignProject) {
        handleAddDesignImage(files[0])
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1
  })

  const { getRootProps: getBrandProjectRootProps, getInputProps: getBrandProjectInputProps, isDragActive: isBrandProjectDragActive } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0 && selectedBrandProject) {
        handleAddBrandImage(files[0])
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1
  })

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const tabs = [
    { id: 'projects', label: 'Project Files', icon: <Layers size={18} /> },
    { id: 'webapps', label: 'Web Apps', icon: <Code2 size={18} /> },
    { id: 'profile', label: 'Profile Picture', icon: <User size={18} /> }
  ]

  const selectedBrandSlides = selectedBrandProject?.images?.length || 0
  const brandLimitReached = selectedBrandSlides >= MAX_BRAND_SLIDES

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-left">
            <Link to="/" className="admin-back-link">
              <ArrowLeft size={20} />
              Back to Portfolio
            </Link>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage only your project files, web apps, and profile picture.</p>
          </div>
          <Link to="/" className="btn-secondary" target="_blank">
            <Eye size={18} />
            Preview Site
          </Link>
        </div>

        <AnimatePresence>
          {message.text && (
            <motion.div
              className={`admin-toast ${message.type}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="admin-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-content">
          {activeTab === 'projects' && (
            <div className="admin-section">
              <h2 className="admin-section-title">
                <Layers size={24} />
                Project Files
              </h2>
              <p className="admin-section-desc">
                Organize projects by type: Graphic Design projects and Brand Identity projects with slide galleries.
              </p>

              <div className="project-files-layout">
                <div className="project-files-block">
                  <div className="admin-section-header">
                    <div>
                      <h3 className="admin-section-title" style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>
                        <Brush size={20} />
                        Graphic Design
                      </h3>
                      <p className="admin-section-desc" style={{ marginBottom: 0 }}>
                        Add project name and description, then upload images for that project.
                      </p>
                    </div>
                    {!showDesignProjectForm && (
                      <button className="btn-primary" onClick={openCreateDesignProjectForm}>
                        <Plus size={18} />
                        New Graphic Project
                      </button>
                    )}
                  </div>

                  {showDesignProjectForm && (
                    <motion.form
                      className="project-form glass-card-static"
                      onSubmit={handleDesignProjectSubmit}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="form-header">
                        <h3>{editingDesignProject ? 'Edit Graphic Design Project' : 'New Graphic Design Project'}</h3>
                        <button type="button" className="close-btn" onClick={resetDesignProjectForm}>
                          <X size={20} />
                        </button>
                      </div>

                      <div className="form-grid">
                        <div className="form-group full-width">
                          <label>Project Name *</label>
                          <input
                            type="text"
                            value={designProjectForm.name}
                            onChange={(e) => setDesignProjectForm({ ...designProjectForm, name: e.target.value })}
                            placeholder="e.g., Event Campaign Design"
                            required
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Project Description</label>
                          <textarea
                            value={designProjectForm.description}
                            onChange={(e) => setDesignProjectForm({ ...designProjectForm, description: e.target.value })}
                            placeholder="Describe what this graphic project is about..."
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={resetDesignProjectForm}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                          {isSaving ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> Save Project</>}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="glass-card-static" style={{ padding: '1rem', marginBottom: '1rem' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Already Uploaded Graphic Files</h4>
                    <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                      These are graphic files you uploaded earlier and that already show on your home page.
                    </p>

                    <div className="file-grid">
                      {legacyGraphicFiles.length > 0 ? (
                        legacyGraphicFiles.map((file) => (
                          <motion.div key={file.filename} className="file-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="file-preview">
                              <img src={file.url} alt={file.filename} />
                            </div>
                            <div className="file-info">
                              <span className="file-name" title={file.filename}>{file.filename}</span>
                            </div>
                            <div className="file-actions">
                              <button className="file-action-btn copy" onClick={() => copyFileUrl(file.url)}>Copy URL</button>
                              <button className="file-action-btn delete" onClick={() => deleteLegacyGraphicFile(file.filename)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '1.5rem 1rem' }}>
                          <Image size={42} />
                          <p>No previously uploaded graphic files found.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="projects-list">
                    {designProjects.map((project) => (
                      <motion.div
                        key={project.id}
                        className={`project-card glass-card-static ${selectedDesignProject?.id === project.id ? 'selected' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedDesignProject(project)}
                      >
                        <div className="project-card-image">
                          {project.images?.length > 0 ? (
                            <img src={project.images[0].url} alt={project.name} />
                          ) : (
                            <div className="no-image"><Brush size={32} /></div>
                          )}
                        </div>
                        <div className="project-card-content">
                          <h4>{project.name}</h4>
                          <p>{project.description || 'No description'}</p>
                          <div className="project-card-tech">
                            <span className="tech-tag">{project.images?.length || 0} image(s)</span>
                          </div>
                        </div>
                        <div className="project-card-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDesignProjectForm(project)
                            }}
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteDesignProject(project.id)
                            }}
                            title="Delete"
                            className="delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {designProjects.length === 0 && !showDesignProjectForm && (
                      <div className="empty-state">
                        <Brush size={48} />
                        <p>No graphic design projects yet.</p>
                      </div>
                    )}
                  </div>

                  {selectedDesignProject && (
                    <motion.div
                      className="glass-card-static"
                      style={{ marginTop: '1.5rem', padding: '1.25rem' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h4 style={{ marginTop: 0, marginBottom: '0.75rem' }}>
                        {selectedDesignProject.name} - Upload Images
                      </h4>

                      <div {...getDesignRootProps()} className={`dropzone ${isDesignDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}>
                        <input {...getDesignInputProps()} />
                        {isUploading ? (
                          <><Loader2 className="dropzone-icon spinning" size={48} /><p>Uploading...</p></>
                        ) : isDesignDragActive ? (
                          <><Upload className="dropzone-icon" size={48} /><p>Drop image here...</p></>
                        ) : (
                          <><Upload className="dropzone-icon" size={48} /><p>Drag & drop graphic images here</p><span className="dropzone-hint">Image files only (max 10MB)</span></>
                        )}
                      </div>

                      <div className="file-grid">
                        {selectedDesignProject.images?.length > 0 ? (
                          selectedDesignProject.images.map((image) => (
                            <motion.div key={image.id} className="file-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                              <div className="file-preview">
                                <img src={image.url} alt={`${selectedDesignProject.name} design`} />
                              </div>
                              <div className="file-actions">
                                <button className="file-action-btn delete" onClick={() => deleteDesignImage(selectedDesignProject.id, image.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <Image size={48} />
                            <p>No images uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="project-files-block">
                  <div className="admin-section-header">
                    <div>
                      <h3 className="admin-section-title" style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>
                        <Palette size={20} />
                        Brand Identity
                      </h3>
                      <p className="admin-section-desc" style={{ marginBottom: 0 }}>
                        Add project name and description, then upload 1 to {MAX_BRAND_SLIDES} slides per project.
                      </p>
                    </div>
                    {!showBrandProjectForm && (
                      <button className="btn-primary" onClick={openCreateBrandProjectForm}>
                        <Plus size={18} />
                        New Brand Identity
                      </button>
                    )}
                  </div>

                  {showBrandProjectForm && (
                    <motion.form
                      className="project-form glass-card-static"
                      onSubmit={handleBrandProjectSubmit}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="form-header">
                        <h3>{editingBrandProject ? 'Edit Brand Identity Project' : 'New Brand Identity Project'}</h3>
                        <button type="button" className="close-btn" onClick={resetBrandProjectForm}>
                          <X size={20} />
                        </button>
                      </div>

                      <div className="form-grid">
                        <div className="form-group full-width">
                          <label>Project Name *</label>
                          <input
                            type="text"
                            value={brandProjectForm.name}
                            onChange={(e) => setBrandProjectForm({ ...brandProjectForm, name: e.target.value })}
                            placeholder="e.g., SynParagon Brand Identity"
                            required
                          />
                        </div>

                        <div className="form-group full-width">
                          <label>Project Description</label>
                          <textarea
                            value={brandProjectForm.description}
                            onChange={(e) => setBrandProjectForm({ ...brandProjectForm, description: e.target.value })}
                            placeholder="Describe this brand identity project..."
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={resetBrandProjectForm}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                          {isSaving ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> Save Project</>}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="projects-list">
                    {brandProjects.map((project) => {
                      const slideCount = project.images?.length || 0
                      return (
                        <motion.div
                          key={project.id}
                          className={`project-card glass-card-static ${selectedBrandProject?.id === project.id ? 'selected' : ''}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedBrandProject(project)}
                        >
                          <div className="project-card-image">
                            {slideCount > 0 ? (
                              <img src={project.images[0].url} alt={project.name} />
                            ) : (
                              <div className="no-image"><Palette size={32} /></div>
                            )}
                          </div>
                          <div className="project-card-content">
                            <h4>{project.name}</h4>
                            <p>{project.description || 'No description'}</p>
                            <div className="project-card-tech">
                              <span className="tech-tag">{slideCount}/{MAX_BRAND_SLIDES} slides</span>
                            </div>
                          </div>
                          <div className="project-card-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditBrandProjectForm(project)
                              }}
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteBrandProject(project.id)
                              }}
                              title="Delete"
                              className="delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}

                    {brandProjects.length === 0 && !showBrandProjectForm && (
                      <div className="empty-state">
                        <Palette size={48} />
                        <p>No brand identity projects yet.</p>
                      </div>
                    )}
                  </div>

                  {selectedBrandProject && (
                    <motion.div
                      className="glass-card-static"
                      style={{ marginTop: '1.5rem', padding: '1.25rem' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h4 style={{ marginTop: 0, marginBottom: '0.35rem' }}>
                        {selectedBrandProject.name} - Upload Slides
                      </h4>
                      <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        {selectedBrandSlides}/{MAX_BRAND_SLIDES} slides uploaded
                      </p>

                      <div
                        {...(brandLimitReached ? {} : getBrandProjectRootProps())}
                        className={`dropzone ${isBrandProjectDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''} ${brandLimitReached ? 'disabled' : ''}`}
                      >
                        <input {...getBrandProjectInputProps()} disabled={brandLimitReached} />
                        {isUploading ? (
                          <><Loader2 className="dropzone-icon spinning" size={48} /><p>Uploading...</p></>
                        ) : brandLimitReached ? (
                          <><AlertCircle className="dropzone-icon" size={48} /><p>Slide limit reached ({MAX_BRAND_SLIDES})</p><span className="dropzone-hint">Delete a slide to upload a new one</span></>
                        ) : isBrandProjectDragActive ? (
                          <><Upload className="dropzone-icon" size={48} /><p>Drop slide here...</p></>
                        ) : (
                          <><Upload className="dropzone-icon" size={48} /><p>Drag & drop brand identity slides here</p><span className="dropzone-hint">Image files only (max 10MB each)</span></>
                        )}
                      </div>

                      <div className="file-grid">
                        {selectedBrandProject.images?.length > 0 ? (
                          selectedBrandProject.images.map((image, index) => (
                            <motion.div key={image.id} className="file-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                              <div className="file-preview">
                                <img src={image.url} alt={`${selectedBrandProject.name} slide ${index + 1}`} />
                                <div className="file-type-badge" style={{ width: 'auto', padding: '0 8px', color: 'white' }}>
                                  Slide {index + 1}
                                </div>
                              </div>
                              <div className="file-actions">
                                <button className="file-action-btn delete" onClick={() => deleteBrandImage(selectedBrandProject.id, image.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                            <Image size={48} />
                            <p>No slides uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'webapps' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">
                    <Code2 size={24} />
                    Web Application Projects
                  </h2>
                  <p className="admin-section-desc">
                    Add and manage your web application projects.
                  </p>
                </div>
                {!showProjectForm && (
                  <button className="btn-primary" onClick={() => setShowProjectForm(true)}>
                    <Plus size={18} />
                    Add Project
                  </button>
                )}
              </div>

              {showProjectForm && (
                <motion.form
                  className="project-form glass-card-static"
                  onSubmit={handleProjectSubmit}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="form-header">
                    <h3>{editingProject ? 'Edit Web App Project' : 'Add New Web App Project'}</h3>
                    <button type="button" className="close-btn" onClick={resetProjectForm}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Project Title *</label>
                      <input
                        type="text"
                        value={projectForm.title}
                        onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                        placeholder="ErrandKart"
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                        placeholder="A full-stack e-commerce platform..."
                        rows={3}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Screenshot URL</label>
                      <input
                        type="text"
                        value={projectForm.image}
                        onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })}
                        placeholder="https://your-image-url.com/screenshot.png"
                      />
                    </div>

                    <div className="form-group">
                      <label>Live Demo URL</label>
                      <input
                        type="text"
                        value={projectForm.liveUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                        placeholder="https://errandkart.com"
                      />
                    </div>

                    <div className="form-group">
                      <label>GitHub URL</label>
                      <input
                        type="text"
                        value={projectForm.githubUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                        placeholder="https://github.com/username/repo"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Technologies (comma separated)</label>
                      <input
                        type="text"
                        value={projectForm.technologies}
                        onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                        placeholder="React.js, Node.js, Express, MongoDB"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={resetProjectForm}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> {editingProject ? 'Update' : 'Save'} Project</>}
                    </button>
                  </div>
                </motion.form>
              )}

              <div className="projects-list">
                {webProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    className="project-card glass-card-static"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="project-card-image">
                      {project.image ? (
                        <img src={project.image} alt={project.name || project.title} />
                      ) : (
                        <div className="no-image"><Layers size={32} /></div>
                      )}
                    </div>
                    <div className="project-card-content">
                      <h4>{project.name || project.title}</h4>
                      <p>{project.description || 'No description'}</p>
                      <div className="project-card-tech">
                        {(project.technologies || project.tech || []).map(t => <span key={t} className="tech-tag">{t}</span>)}
                      </div>
                      <div className="project-card-links">
                        {(project.liveUrl || project.liveDemo) && (project.liveUrl || project.liveDemo) !== '#' && (
                          <a href={project.liveUrl || project.liveDemo} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={14} /> Demo
                          </a>
                        )}
                        {(project.githubUrl || project.github) && (project.githubUrl || project.github) !== '#' && (
                          <a href={project.githubUrl || project.github} target="_blank" rel="noopener noreferrer">
                            <Github size={14} /> Code
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="project-card-actions">
                      <button onClick={() => editProject(project)} title="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => deleteProject(project.id)} title="Delete" className="delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {webProjects.length === 0 && !showProjectForm && (
                  <div className="empty-state">
                    <Code2 size={48} />
                    <p>No web projects yet. Click Add Project to create one.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="admin-section">
              <h2 className="admin-section-title"><User size={24} />Profile Picture</h2>
              <p className="admin-section-desc">Upload your profile picture. It will automatically appear on the home page.</p>

              <div {...getProfileRootProps()} className={`dropzone ${isProfileDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}>
                <input {...getProfileInputProps()} />
                {isUploading ? (
                  <><Loader2 className="dropzone-icon spinning" size={48} /><p>Uploading...</p></>
                ) : (
                  <><User className="dropzone-icon" size={48} /><p>Drag & drop your profile picture here</p><span className="dropzone-hint">Image only (max 10MB)</span></>
                )}
              </div>

              <div className="file-grid">
                {profileFiles.map((file) => (
                  <motion.div key={file.filename} className="file-card profile-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="file-preview profile-preview"><img src={file.url} alt="Profile" /></div>
                    <div className="file-info"><span className="file-size">{formatFileSize(file.size)}</span></div>
                    <div className="file-actions">
                      <button className="file-action-btn delete" onClick={() => deleteProfileFile(file.filename)}><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
                {profileFiles.length === 0 && (
                  <div className="empty-state"><User size={48} /><p>No profile picture uploaded yet</p></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPage
