import { useEffect, useMemo, useState } from 'react'
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
import { fetchApi } from '../lib/apiClient'

const imageAccept = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg']
}
const MAX_BRAND_SLIDES = 25

const createImageItem = (url, index) => ({
  id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  url
})

const requestJson = async (path, options = {}) => {
  const response = await fetchApi(path, options)

  try {
    const data = await response.json()
    if (typeof data.success !== 'boolean') {
      data.success = response.ok
    }
    if (!response.ok && !data.message) {
      data.message = `Request failed (${response.status})`
    }
    return data
  } catch {
    return {
      success: false,
      message: 'Could not connect to the server API. Check backend URL and deployment.'
    }
  }
}

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('projects')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingGraphic, setIsUploadingGraphic] = useState(false)
  const [isUploadingBrand, setIsUploadingBrand] = useState(false)
  const [isUploadingProfile, setIsUploadingProfile] = useState(false)

  const [profileFiles, setProfileFiles] = useState([])
  const [webProjects, setWebProjects] = useState([])
  const [designProjects, setDesignProjects] = useState([])
  const [brandProjects, setBrandProjects] = useState([])

  const [showWebForm, setShowWebForm] = useState(false)
  const [editingWebProjectId, setEditingWebProjectId] = useState(null)
  const [webForm, setWebForm] = useState({
    title: '',
    description: '',
    image: '',
    liveUrl: '',
    githubUrl: '',
    technologies: ''
  })

  const [showDesignForm, setShowDesignForm] = useState(false)
  const [editingDesignProjectId, setEditingDesignProjectId] = useState(null)
  const [selectedDesignProjectId, setSelectedDesignProjectId] = useState('')
  const [designForm, setDesignForm] = useState({
    name: '',
    description: ''
  })

  const [showBrandForm, setShowBrandForm] = useState(false)
  const [editingBrandProjectId, setEditingBrandProjectId] = useState(null)
  const [selectedBrandProjectId, setSelectedBrandProjectId] = useState('')
  const [brandForm, setBrandForm] = useState({
    name: '',
    description: ''
  })

  const selectedDesignProject = useMemo(
    () => designProjects.find(project => String(project.id) === String(selectedDesignProjectId)) || null,
    [designProjects, selectedDesignProjectId]
  )

  const selectedBrandProject = useMemo(
    () => brandProjects.find(project => String(project.id) === String(selectedBrandProjectId)) || null,
    [brandProjects, selectedBrandProjectId]
  )

  const activeDesignProject = selectedDesignProject || designProjects[0] || null
  const activeBrandProject = selectedBrandProject || brandProjects[0] || null

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
      const data = await requestJson('/webprojects')
      setWebProjects(data.success ? (data.projects || []) : [])
    } catch (error) {
      console.error('Failed to fetch web projects:', error)
      setWebProjects([])
    }
  }

  const fetchDesignProjects = async () => {
    try {
      const data = await requestJson('/design-projects')
      setDesignProjects(data.success ? (data.projects || []) : [])
    } catch (error) {
      console.error('Failed to fetch design projects:', error)
      setDesignProjects([])
    }
  }

  const fetchBrandProjects = async () => {
    try {
      const data = await requestJson('/brand-projects')
      setBrandProjects(data.success ? (data.projects || []) : [])
    } catch (error) {
      console.error('Failed to fetch brand projects:', error)
      setBrandProjects([])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchProfileFiles(),
        fetchWebProjects(),
        fetchDesignProjects(),
        fetchBrandProjects()
      ])
    }

    loadData()
  }, [])

  useEffect(() => {
    if (designProjects.length === 0) {
      if (selectedDesignProjectId) setSelectedDesignProjectId('')
      return
    }

    const hasValidSelection = designProjects.some(
      (project) => String(project.id) === String(selectedDesignProjectId)
    )

    if (!hasValidSelection) {
      setSelectedDesignProjectId(String(designProjects[0].id))
    }
  }, [designProjects, selectedDesignProjectId])

  useEffect(() => {
    if (brandProjects.length === 0) {
      if (selectedBrandProjectId) setSelectedBrandProjectId('')
      return
    }

    const hasValidSelection = brandProjects.some(
      (project) => String(project.id) === String(selectedBrandProjectId)
    )

    if (!hasValidSelection) {
      setSelectedBrandProjectId(String(brandProjects[0].id))
    }
  }, [brandProjects, selectedBrandProjectId])

  const resetWebForm = () => {
    setEditingWebProjectId(null)
    setShowWebForm(false)
    setWebForm({
      title: '',
      description: '',
      image: '',
      liveUrl: '',
      githubUrl: '',
      technologies: ''
    })
  }

  const openEditWebForm = (project) => {
    setEditingWebProjectId(project.id)
    setWebForm({
      title: project.name || project.title || '',
      description: project.description || '',
      image: project.image || '',
      liveUrl: project.liveUrl || project.liveDemo || project.url || '',
      githubUrl: project.githubUrl || project.github || '',
      technologies: Array.isArray(project.technologies)
        ? project.technologies.join(', ')
        : (Array.isArray(project.tech) ? project.tech.join(', ') : '')
    })
    setShowWebForm(true)
  }

  const handleWebSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const technologies = webForm.technologies.split(',').map(item => item.trim()).filter(Boolean)

    try {
      const endpoint = editingWebProjectId
        ? `/webprojects/${editingWebProjectId}`
        : '/webprojects'

      const data = await requestJson(endpoint, {
        method: editingWebProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: webForm.title,
          description: webForm.description,
          image: webForm.image,
          liveUrl: webForm.liveUrl,
          githubUrl: webForm.githubUrl,
          technologies
        })
      })

      if (data.success) {
        showMessage('success', editingWebProjectId ? 'Web app updated' : 'Web app created')
        await fetchWebProjects()
        resetWebForm()
      } else {
        showMessage('error', data.message || 'Failed to save web app')
      }
    } catch (error) {
      console.error('Save web app error:', error)
      showMessage('error', 'Failed to save web app')
    }

    setIsSaving(false)
  }

  const deleteWebProject = async (id) => {
    if (!confirm('Are you sure you want to delete this web app project?')) return
    try {
      const data = await requestJson(`/webprojects/${id}`, { method: 'DELETE' })
      if (data.success) {
        showMessage('success', 'Web app deleted')
        fetchWebProjects()
      } else {
        showMessage('error', data.message || 'Failed to delete web app')
      }
    } catch (error) {
      console.error('Delete web app error:', error)
      showMessage('error', 'Failed to delete web app')
    }
  }

  const resetDesignForm = () => {
    setEditingDesignProjectId(null)
    setShowDesignForm(false)
    setDesignForm({ name: '', description: '' })
  }

  const openEditDesignForm = (project) => {
    setEditingDesignProjectId(project.id)
    setDesignForm({
      name: project.name || '',
      description: project.description || ''
    })
    setShowDesignForm(true)
  }

  const handleDesignSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const endpoint = editingDesignProjectId
        ? `/design-projects/${editingDesignProjectId}`
        : '/design-projects'

      const existingProject = designProjects.find(project => String(project.id) === String(editingDesignProjectId))

      const data = await requestJson(endpoint, {
        method: editingDesignProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designForm.name,
          description: designForm.description,
          images: existingProject?.images || []
        })
      })

      if (data.success) {
        showMessage('success', editingDesignProjectId ? 'Graphic project updated' : 'Graphic project created')
        setSelectedDesignProjectId(String(data.project?.id || ''))
        await fetchDesignProjects()
        resetDesignForm()
      } else {
        showMessage('error', data.message || 'Failed to save graphic project')
      }
    } catch (error) {
      console.error('Save graphic project error:', error)
      showMessage('error', 'Failed to save graphic project')
    }

    setIsSaving(false)
  }

  const deleteDesignProject = async (id) => {
    if (!confirm('Are you sure you want to delete this graphic project?')) return
    try {
      const data = await requestJson(`/design-projects/${id}`, { method: 'DELETE' })
      if (data.success) {
        showMessage('success', 'Graphic project deleted')
        if (String(selectedDesignProjectId) === String(id)) {
          setSelectedDesignProjectId('')
        }
        fetchDesignProjects()
      } else {
        showMessage('error', data.message || 'Failed to delete graphic project')
      }
    } catch (error) {
      console.error('Delete graphic project error:', error)
      showMessage('error', 'Failed to delete graphic project')
    }
  }

  const uploadGraphicImages = async (files) => {
    const projectToUpload = activeDesignProject

    if (!projectToUpload) {
      showMessage('error', 'Select a graphic project first')
      return
    }
    if (!files || files.length === 0) return

    setIsUploadingGraphic(true)
    try {
      const uploaded = []
      const uploadErrors = []
      for (const [index, file] of files.entries()) {
        const result = await uploadToSupabaseDirect(file, 'project', { category: 'graphic' })
        if (result.success) {
          uploaded.push(createImageItem(result.url, index))
        } else if (result.error) {
          uploadErrors.push(result.error)
        }
      }

      if (uploaded.length === 0) {
        showMessage('error', uploadErrors[0] || 'No file was uploaded')
        setIsUploadingGraphic(false)
        return
      }

      const updatedImages = [...(projectToUpload.images || []), ...uploaded]
      const data = await requestJson(`/design-projects/${projectToUpload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectToUpload,
          images: updatedImages
        })
      })

      if (data.success) {
        showMessage('success', `${uploaded.length} graphic image(s) uploaded`)
        setSelectedDesignProjectId(String(data.project.id))
        fetchDesignProjects()
      } else {
        showMessage('error', data.message || 'Failed to save graphic uploads')
      }
    } catch (error) {
      console.error('Upload graphic images error:', error)
      showMessage('error', 'Failed to upload graphic images')
    }
    setIsUploadingGraphic(false)
  }

  const deleteGraphicImage = async (projectId, imageId) => {
    if (!confirm('Delete this graphic image?')) return

    const project = designProjects.find(item => String(item.id) === String(projectId))
    if (!project) {
      showMessage('error', 'Graphic project not found')
      return
    }

    try {
      const images = (project.images || []).filter(image => image.id !== imageId)
      const data = await requestJson(`/design-projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, images })
      })

      if (data.success) {
        showMessage('success', 'Graphic image deleted')
        setSelectedDesignProjectId(String(data.project.id))
        fetchDesignProjects()
      } else {
        showMessage('error', data.message || 'Failed to delete graphic image')
      }
    } catch (error) {
      console.error('Delete graphic image error:', error)
      showMessage('error', 'Failed to delete graphic image')
    }
  }

  const resetBrandForm = () => {
    setEditingBrandProjectId(null)
    setShowBrandForm(false)
    setBrandForm({ name: '', description: '' })
  }

  const openEditBrandForm = (project) => {
    setEditingBrandProjectId(project.id)
    setBrandForm({
      name: project.name || '',
      description: project.description || ''
    })
    setShowBrandForm(true)
  }

  const handleBrandSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const endpoint = editingBrandProjectId
        ? `/brand-projects/${editingBrandProjectId}`
        : '/brand-projects'

      const existingProject = brandProjects.find(project => String(project.id) === String(editingBrandProjectId))

      const data = await requestJson(endpoint, {
        method: editingBrandProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandForm.name,
          description: brandForm.description,
          images: existingProject?.images || []
        })
      })

      if (data.success) {
        showMessage('success', editingBrandProjectId ? 'Brand identity updated' : 'Brand identity created')
        setSelectedBrandProjectId(String(data.project?.id || ''))
        await fetchBrandProjects()
        resetBrandForm()
      } else {
        showMessage('error', data.message || 'Failed to save brand identity')
      }
    } catch (error) {
      console.error('Save brand project error:', error)
      showMessage('error', 'Failed to save brand identity')
    }

    setIsSaving(false)
  }

  const deleteBrandProject = async (id) => {
    if (!confirm('Are you sure you want to delete this brand identity project?')) return
    try {
      const data = await requestJson(`/brand-projects/${id}`, { method: 'DELETE' })
      if (data.success) {
        showMessage('success', 'Brand identity project deleted')
        if (String(selectedBrandProjectId) === String(id)) {
          setSelectedBrandProjectId('')
        }
        fetchBrandProjects()
      } else {
        showMessage('error', data.message || 'Failed to delete brand identity project')
      }
    } catch (error) {
      console.error('Delete brand project error:', error)
      showMessage('error', 'Failed to delete brand identity project')
    }
  }

  const uploadBrandSlides = async (files) => {
    const projectToUpload = activeBrandProject

    if (!projectToUpload) {
      showMessage('error', 'Select a brand identity project first')
      return
    }
    if (!files || files.length === 0) return

    const existingSlides = Array.isArray(projectToUpload.images) ? projectToUpload.images.length : 0
    const remainingSlots = Math.max(0, MAX_BRAND_SLIDES - existingSlides)
    if (remainingSlots === 0) {
      showMessage('error', `This brand identity project already has ${MAX_BRAND_SLIDES} slides`)
      return
    }

    setIsUploadingBrand(true)
    try {
      const uploaded = []
      const uploadErrors = []
      const filesToUpload = files.slice(0, remainingSlots)
      const skippedCount = files.length - filesToUpload.length

      for (const [index, file] of filesToUpload.entries()) {
        const result = await uploadToSupabaseDirect(file, 'project', { category: 'brand-slide' })
        if (result.success) {
          uploaded.push(createImageItem(result.url, index))
        } else if (result.error) {
          uploadErrors.push(result.error)
        }
      }

      if (uploaded.length === 0) {
        showMessage('error', uploadErrors[0] || 'No slide was uploaded')
        setIsUploadingBrand(false)
        return
      }

      const updatedSlides = [...(projectToUpload.images || []), ...uploaded]
      const data = await requestJson(`/brand-projects/${projectToUpload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectToUpload,
          images: updatedSlides
        })
      })

      if (data.success) {
        const skippedMessage = skippedCount > 0 ? ` (${skippedCount} skipped to keep max ${MAX_BRAND_SLIDES})` : ''
        showMessage('success', `${uploaded.length} brand slide(s) uploaded${skippedMessage}`)
        setSelectedBrandProjectId(String(data.project.id))
        fetchBrandProjects()
      } else {
        showMessage('error', data.message || 'Failed to save brand slides')
      }
    } catch (error) {
      console.error('Upload brand slides error:', error)
      showMessage('error', 'Failed to upload brand slides')
    }
    setIsUploadingBrand(false)
  }

  const deleteBrandSlide = async (projectId, imageId) => {
    if (!confirm('Delete this brand slide?')) return

    const project = brandProjects.find(item => String(item.id) === String(projectId))
    if (!project) {
      showMessage('error', 'Brand identity project not found')
      return
    }

    try {
      const images = (project.images || []).filter(image => image.id !== imageId)
      const data = await requestJson(`/brand-projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, images })
      })

      if (data.success) {
        showMessage('success', 'Brand slide deleted')
        setSelectedBrandProjectId(String(data.project.id))
        fetchBrandProjects()
      } else {
        showMessage('error', data.message || 'Failed to delete brand slide')
      }
    } catch (error) {
      console.error('Delete brand slide error:', error)
      showMessage('error', 'Failed to delete brand slide')
    }
  }

  const onProfileDrop = async (files) => {
    if (!files || files.length === 0) return

    setIsUploadingProfile(true)
    try {
      const result = await uploadToSupabaseDirect(files[0], 'profile')
      if (!result.success) {
        showMessage('error', result.error || 'Failed to upload profile picture')
        setIsUploadingProfile(false)
        return
      }
      showMessage('success', 'Profile picture uploaded')
      fetchProfileFiles()
    } catch (error) {
      console.error('Upload profile error:', error)
      showMessage('error', 'Failed to upload profile picture')
    }
    setIsUploadingProfile(false)
  }

  const deleteProfileFile = async (filename) => {
    if (!confirm('Delete this profile picture?')) return
    try {
      const result = await deleteFromSupabaseDirect(filename, 'profile')
      if (result.success) {
        showMessage('success', 'Profile picture deleted')
        fetchProfileFiles()
      } else {
        showMessage('error', result.error || 'Failed to delete profile picture')
      }
    } catch (error) {
      console.error('Delete profile error:', error)
      showMessage('error', 'Failed to delete profile picture')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const {
    getRootProps: getGraphicRootProps,
    getInputProps: getGraphicInputProps,
    isDragActive: isGraphicDragActive
  } = useDropzone({
    onDrop: uploadGraphicImages,
    accept: imageAccept,
    maxSize: 10 * 1024 * 1024,
    maxFiles: 20
  })

  const {
    getRootProps: getBrandRootProps,
    getInputProps: getBrandInputProps,
    isDragActive: isBrandDragActive
  } = useDropzone({
    onDrop: uploadBrandSlides,
    accept: imageAccept,
    maxSize: 10 * 1024 * 1024,
    maxFiles: MAX_BRAND_SLIDES
  })

  const {
    getRootProps: getProfileRootProps,
    getInputProps: getProfileInputProps,
    isDragActive: isProfileDragActive
  } = useDropzone({
    onDrop: onProfileDrop,
    accept: imageAccept,
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1
  })

  const tabs = [
    { id: 'projects', label: 'Project Files', icon: <Layers size={18} /> },
    { id: 'webapps', label: 'Web Apps', icon: <Code2 size={18} /> },
    { id: 'profile', label: 'Profile Picture', icon: <User size={18} /> }
  ]

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
            <p className="admin-subtitle">Manage Project Files, Web Apps, and Profile Picture</p>
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
                Graphic Design and Brand Identity Design each have project name, description, and file uploads.
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
                        Create a project with name and description, then upload images to it.
                      </p>
                    </div>
                    {!showDesignForm && (
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setEditingDesignProjectId(null)
                          setDesignForm({ name: '', description: '' })
                          setShowDesignForm(true)
                        }}
                      >
                        <Plus size={18} />
                        New Graphic Project
                      </button>
                    )}
                  </div>

                  {showDesignForm && (
                    <motion.form
                      className="project-form glass-card-static"
                      onSubmit={handleDesignSubmit}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="form-header">
                        <h3>{editingDesignProjectId ? 'Edit Graphic Project' : 'New Graphic Project'}</h3>
                        <button type="button" className="close-btn" onClick={resetDesignForm}>
                          <X size={20} />
                        </button>
                      </div>

                      <div className="form-grid">
                        <div className="form-group full-width">
                          <label>Project Name *</label>
                          <input
                            type="text"
                            value={designForm.name}
                            onChange={(e) => setDesignForm({ ...designForm, name: e.target.value })}
                            placeholder="e.g., Festival Event Campaign"
                            required
                          />
                        </div>
                        <div className="form-group full-width">
                          <label>Project Description *</label>
                          <textarea
                            value={designForm.description}
                            onChange={(e) => setDesignForm({ ...designForm, description: e.target.value })}
                            placeholder="Describe this graphic design project..."
                            rows={3}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={resetDesignForm}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                          {isSaving ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> Save Project</>}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="glass-card-static" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Upload Graphic Images</h4>
                    <p style={{ marginTop: 0, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      Choose a graphic project, then use Upload to add images with that project name and description.
                    </p>

                    {designProjects.length > 0 ? (
                      <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                        <label>Select Graphic Project</label>
                        <select
                          value={selectedDesignProjectId}
                          onChange={(e) => setSelectedDesignProjectId(e.target.value)}
                        >
                          <option value="">Choose project...</option>
                          {designProjects.map((project) => (
                            <option key={project.id} value={String(project.id)}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p style={{ margin: '0 0 0.85rem 0', color: 'var(--text-tertiary)' }}>
                        Create a graphic project first.
                      </p>
                    )}

                    <div style={{ marginBottom: '0.85rem' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => document.getElementById('graphic-upload-input')?.click()}
                        disabled={!activeDesignProject || isUploadingGraphic}
                      >
                        <Upload size={16} />
                        Upload Graphic Design
                      </button>
                    </div>

                    <div
                      {...(activeDesignProject ? getGraphicRootProps() : {})}
                      className={`dropzone ${isGraphicDragActive ? 'active' : ''} ${isUploadingGraphic ? 'uploading' : ''} ${!activeDesignProject ? 'disabled' : ''}`}
                    >
                      <input id="graphic-upload-input" {...getGraphicInputProps()} disabled={!activeDesignProject} />
                      {isUploadingGraphic ? (
                        <><Loader2 className="dropzone-icon spinning" size={48} /><p>Uploading...</p></>
                      ) : !activeDesignProject ? (
                        <><Upload className="dropzone-icon" size={48} /><p>Select a project first to enable upload</p><span className="dropzone-hint">Then drag & drop your images</span></>
                      ) : isGraphicDragActive ? (
                        <><Upload className="dropzone-icon" size={48} /><p>Drop images here...</p></>
                      ) : (
                        <><Upload className="dropzone-icon" size={48} /><p>Drag & drop graphic images here</p><span className="dropzone-hint">Image files only (max 10MB each)</span></>
                      )}
                    </div>

                    {activeDesignProject && (
                      <div className="file-grid">
                        {(activeDesignProject.images || []).length > 0 ? (
                          activeDesignProject.images.map((image) => (
                            <motion.div key={image.id} className="file-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                              <div className="file-preview">
                                <img src={image.url} alt={`${activeDesignProject.name} design`} />
                              </div>
                              <div className="file-actions">
                                <button className="file-action-btn delete" onClick={() => deleteGraphicImage(activeDesignProject.id, image.id)}>
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
                    )}
                  </div>

                  <div className="projects-list">
                    {designProjects.map((project) => (
                      <motion.div
                        key={project.id}
                        className={`project-card glass-card-static ${String(selectedDesignProjectId) === String(project.id) ? 'selected' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedDesignProjectId(String(project.id))}
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
                              setSelectedDesignProjectId(String(project.id))
                              setTimeout(() => {
                                const input = document.getElementById('graphic-upload-input')
                                if (input) input.click()
                              }, 0)
                            }}
                            title="Upload Images"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditDesignForm(project)
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
                            className="delete"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {designProjects.length === 0 && !showDesignForm && (
                      <div className="empty-state">
                        <Brush size={48} />
                        <p>No graphic projects yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="project-files-block">
                  <div className="admin-section-header">
                    <div>
                      <h3 className="admin-section-title" style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>
                        <Palette size={20} />
                        Brand Identity Design
                      </h3>
                      <p className="admin-section-desc" style={{ marginBottom: 0 }}>
                        Create a brand identity project with name and description, then upload slides (up to {MAX_BRAND_SLIDES} per project).
                      </p>
                    </div>
                    {!showBrandForm && (
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setEditingBrandProjectId(null)
                          setBrandForm({ name: '', description: '' })
                          setShowBrandForm(true)
                        }}
                      >
                        <Plus size={18} />
                        New Brand Identity Design
                      </button>
                    )}
                  </div>

                  {showBrandForm && (
                    <motion.form
                      className="project-form glass-card-static"
                      onSubmit={handleBrandSubmit}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="form-header">
                        <h3>{editingBrandProjectId ? 'Edit Brand Identity Design' : 'New Brand Identity Design'}</h3>
                        <button type="button" className="close-btn" onClick={resetBrandForm}>
                          <X size={20} />
                        </button>
                      </div>

                      <div className="form-grid">
                        <div className="form-group full-width">
                          <label>Project Name *</label>
                          <input
                            type="text"
                            value={brandForm.name}
                            onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                            placeholder="e.g., SynParagon Brand Identity Design"
                            required
                          />
                        </div>
                        <div className="form-group full-width">
                          <label>Project Description *</label>
                          <textarea
                            value={brandForm.description}
                            onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                            placeholder="Describe this brand identity project..."
                            rows={3}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={resetBrandForm}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                          {isSaving ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> Save Project</>}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="glass-card-static" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Upload Brand Slides</h4>
                    <p style={{ marginTop: 0, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                      Select the brand identity design project and upload slides. A project can hold up to {MAX_BRAND_SLIDES} slides.
                    </p>

                    {brandProjects.length > 0 ? (
                      <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                        <label>Select Brand Identity Design Project</label>
                        <select
                          value={selectedBrandProjectId}
                          onChange={(e) => setSelectedBrandProjectId(e.target.value)}
                        >
                          <option value="">Choose project...</option>
                          {brandProjects.map((project) => (
                            <option key={project.id} value={String(project.id)}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p style={{ margin: '0 0 0.85rem 0', color: 'var(--text-tertiary)' }}>
                        Create a brand identity project first.
                      </p>
                    )}

                    <div style={{ marginBottom: '0.85rem' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => document.getElementById('brand-upload-input')?.click()}
                        disabled={!activeBrandProject || isUploadingBrand}
                      >
                        <Upload size={16} />
                        Upload Brand Identity Slides
                      </button>
                    </div>

                    <div
                      {...(activeBrandProject ? getBrandRootProps() : {})}
                      className={`dropzone ${isBrandDragActive ? 'active' : ''} ${isUploadingBrand ? 'uploading' : ''} ${!activeBrandProject ? 'disabled' : ''}`}
                    >
                      <input id="brand-upload-input" {...getBrandInputProps()} disabled={!activeBrandProject} />
                      {isUploadingBrand ? (
                        <><Loader2 className="dropzone-icon spinning" size={48} /><p>Uploading...</p></>
                      ) : !activeBrandProject ? (
                        <><Upload className="dropzone-icon" size={48} /><p>Select a project first to enable upload</p><span className="dropzone-hint">Then drag & drop your slides</span></>
                      ) : isBrandDragActive ? (
                        <><Upload className="dropzone-icon" size={48} /><p>Drop slides here...</p></>
                      ) : (
                        <><Upload className="dropzone-icon" size={48} /><p>Drag & drop brand slides here</p><span className="dropzone-hint">Image files only (max 10MB each)</span></>
                      )}
                    </div>

                    {activeBrandProject && (
                      <div className="file-grid">
                        {(activeBrandProject.images || []).length > 0 ? (
                          activeBrandProject.images.map((image, index) => (
                            <motion.div key={image.id} className="file-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                              <div className="file-preview">
                                <img src={image.url} alt={`${activeBrandProject.name} slide ${index + 1}`} />
                                <div className="file-type-badge" style={{ width: 'auto', padding: '0 8px', color: 'white' }}>
                                  Slide {index + 1}
                                </div>
                              </div>
                              <div className="file-actions">
                                <button className="file-action-btn delete" onClick={() => deleteBrandSlide(activeBrandProject.id, image.id)}>
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
                    )}
                  </div>

                  <div className="projects-list">
                    {brandProjects.map((project) => (
                      <motion.div
                        key={project.id}
                        className={`project-card glass-card-static ${String(selectedBrandProjectId) === String(project.id) ? 'selected' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedBrandProjectId(String(project.id))}
                      >
                        <div className="project-card-image">
                          {project.images?.length > 0 ? (
                            <img src={project.images[0].url} alt={project.name} />
                          ) : (
                            <div className="no-image"><Palette size={32} /></div>
                          )}
                        </div>
                        <div className="project-card-content">
                          <h4>{project.name}</h4>
                          <p>{project.description || 'No description'}</p>
                          <div className="project-card-tech">
                            <span className="tech-tag">{project.images?.length || 0} slide(s)</span>
                          </div>
                        </div>
                        <div className="project-card-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedBrandProjectId(String(project.id))
                              setTimeout(() => {
                                const input = document.getElementById('brand-upload-input')
                                if (input) input.click()
                              }, 0)
                            }}
                            title="Upload Slides"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditBrandForm(project)
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
                            className="delete"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {brandProjects.length === 0 && !showBrandForm && (
                      <div className="empty-state">
                        <Palette size={48} />
                        <p>No brand identity projects yet.</p>
                      </div>
                    )}
                  </div>
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
                  <p className="admin-section-desc">Add and manage your web app projects.</p>
                </div>
                {!showWebForm && (
                  <button className="btn-primary" onClick={() => setShowWebForm(true)}>
                    <Plus size={18} />
                    Add Web App
                  </button>
                )}
              </div>

              {showWebForm && (
                <motion.form
                  className="project-form glass-card-static"
                  onSubmit={handleWebSubmit}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="form-header">
                    <h3>{editingWebProjectId ? 'Edit Web App' : 'New Web App'}</h3>
                    <button type="button" className="close-btn" onClick={resetWebForm}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Project Title *</label>
                      <input
                        type="text"
                        value={webForm.title}
                        onChange={(e) => setWebForm({ ...webForm, title: e.target.value })}
                        placeholder="ErrandKart"
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={webForm.description}
                        onChange={(e) => setWebForm({ ...webForm, description: e.target.value })}
                        placeholder="A full-stack web app..."
                        rows={3}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Screenshot URL</label>
                      <input
                        type="text"
                        value={webForm.image}
                        onChange={(e) => setWebForm({ ...webForm, image: e.target.value })}
                        placeholder="https://your-image-url.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Live Demo URL</label>
                      <input
                        type="text"
                        value={webForm.liveUrl}
                        onChange={(e) => setWebForm({ ...webForm, liveUrl: e.target.value })}
                        placeholder="https://your-live-app.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>GitHub URL</label>
                      <input
                        type="text"
                        value={webForm.githubUrl}
                        onChange={(e) => setWebForm({ ...webForm, githubUrl: e.target.value })}
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Technologies (comma separated)</label>
                      <input
                        type="text"
                        value={webForm.technologies}
                        onChange={(e) => setWebForm({ ...webForm, technologies: e.target.value })}
                        placeholder="React, Node.js, Express"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={resetWebForm}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> Save Project</>}
                    </button>
                  </div>
                </motion.form>
              )}

              <div className="projects-list">
                {webProjects.map((project) => (
                  <motion.div key={project.id} className="project-card glass-card-static" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                        {(project.technologies || project.tech || []).map(tech => <span key={tech} className="tech-tag">{tech}</span>)}
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
                      <button onClick={() => openEditWebForm(project)} title="Edit"><Edit3 size={16} /></button>
                      <button onClick={() => deleteWebProject(project.id)} className="delete" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}

                {webProjects.length === 0 && !showWebForm && (
                  <div className="empty-state">
                    <Code2 size={48} />
                    <p>No web app projects yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="admin-section">
              <h2 className="admin-section-title"><User size={24} />Profile Picture</h2>
              <p className="admin-section-desc">Upload your profile picture for the homepage.</p>

              <div {...getProfileRootProps()} className={`dropzone ${isProfileDragActive ? 'active' : ''} ${isUploadingProfile ? 'uploading' : ''}`}>
                <input {...getProfileInputProps()} />
                {isUploadingProfile ? (
                  <><Loader2 className="dropzone-icon spinning" size={48} /><p>Uploading...</p></>
                ) : (
                  <><User className="dropzone-icon" size={48} /><p>Drag & drop your profile picture here</p><span className="dropzone-hint">Image only (max 10MB)</span></>
                )}
              </div>

              <div className="file-grid">
                {profileFiles.map((file) => (
                  <motion.div key={file.filename} className="file-card profile-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="file-preview profile-preview">
                      <img src={file.url} alt="Profile" />
                    </div>
                    <div className="file-info">
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="file-actions">
                      <button className="file-action-btn delete" onClick={() => deleteProfileFile(file.filename)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {profileFiles.length === 0 && (
                  <div className="empty-state">
                    <User size={48} />
                    <p>No profile picture uploaded yet.</p>
                  </div>
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
