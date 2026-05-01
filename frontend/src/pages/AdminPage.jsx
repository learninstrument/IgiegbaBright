import { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Image,
  Trash2,
  ArrowLeft,
  Plus,
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
    file: null,
    liveUrl: '',
    githubUrl: '',
    technologies: ''
  })

  const [showDesignForm, setShowDesignForm] = useState(false)
  const [editingDesignProjectId, setEditingDesignProjectId] = useState(null)
  const [selectedDesignProjectId, setSelectedDesignProjectId] = useState('')
  const [designForm, setDesignForm] = useState({
    name: '',
    description: '',
    files: []
  })

  const [showBrandForm, setShowBrandForm] = useState(false)
  const [editingBrandProjectId, setEditingBrandProjectId] = useState(null)
  const [selectedBrandProjectId, setSelectedBrandProjectId] = useState('')
  const [brandForm, setBrandForm] = useState({
    name: '',
    description: '',
    files: []
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
      file: null,
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
      file: null,
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
      let finalImageUrl = webForm.image;

      if (webForm.file) {
        const result = await uploadToSupabaseDirect(webForm.file, 'project', { category: 'web' });
        if (result.success) {
          finalImageUrl = result.url;
        } else {
          showMessage('error', `Failed to upload image: ${result.error}`);
          setIsSaving(false);
          return;
        }
      }

      const endpoint = editingWebProjectId
        ? `/webprojects/${editingWebProjectId}`
        : '/webprojects'

      const data = await requestJson(endpoint, {
        method: editingWebProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: webForm.title,
          description: webForm.description,
          image: finalImageUrl,
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
    setDesignForm({ name: '', description: '', files: [] })
  }

  const openEditDesignForm = (project) => {
    setEditingDesignProjectId(project.id)
    setDesignForm({
      name: project.name || '',
      description: project.description || '',
      files: []
    })
    setShowDesignForm(true)
  }

  const handleDesignSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let uploadedImages = [];
      const endpoint = editingDesignProjectId
        ? `/design-projects/${editingDesignProjectId}`
        : '/design-projects'

      const existingProject = designProjects.find(project => String(project.id) === String(editingDesignProjectId))
      if (existingProject && existingProject.images) {
        uploadedImages = [...existingProject.images];
      }

      if (designForm.files && designForm.files.length > 0) {
        for (const [index, file] of designForm.files.entries()) {
          const result = await uploadToSupabaseDirect(file, 'project', { category: 'graphic' })
          if (result.success) {
            uploadedImages.push(createImageItem(result.url, index))
          } else {
            showMessage('error', `Failed to upload ${file.name}: ${result.error}`)
          }
        }
      }

      const data = await requestJson(endpoint, {
        method: editingDesignProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designForm.name,
          description: designForm.description,
          images: uploadedImages
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
    setBrandForm({ name: '', description: '', files: [] })
  }

  const openEditBrandForm = (project) => {
    setEditingBrandProjectId(project.id)
    setBrandForm({
      name: project.name || '',
      description: project.description || '',
      files: []
    })
    setShowBrandForm(true)
  }

  const handleBrandSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let uploadedImages = [];
      const endpoint = editingBrandProjectId
        ? `/brand-projects/${editingBrandProjectId}`
        : '/brand-projects'

      const existingProject = brandProjects.find(project => String(project.id) === String(editingBrandProjectId))
      if (existingProject && existingProject.images) {
        uploadedImages = [...existingProject.images];
      }

      if (brandForm.files && brandForm.files.length > 0) {
        const remainingSlots = Math.max(0, MAX_BRAND_SLIDES - uploadedImages.length);
        const filesToUpload = brandForm.files.slice(0, remainingSlots);

        for (const [index, file] of filesToUpload.entries()) {
          const result = await uploadToSupabaseDirect(file, 'project', { category: 'brand-slide' })
          if (result.success) {
            uploadedImages.push(createImageItem(result.url, index))
          } else {
             showMessage('error', `Failed to upload ${file.name}: ${result.error}`)
          }
        }
      }

      const data = await requestJson(endpoint, {
        method: editingBrandProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandForm.name,
          description: brandForm.description,
          images: uploadedImages
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
    isDragActive: isGraphicDragActive,
    open: openGraphicDropzone
  } = useDropzone({
    onDrop: uploadGraphicImages,
    accept: imageAccept,
    maxSize: 10 * 1024 * 1024,
    maxFiles: 20,
    noClick: true,
    noKeyboard: true
  })

  const {
    getRootProps: getBrandRootProps,
    getInputProps: getBrandInputProps,
    isDragActive: isBrandDragActive,
    open: openBrandDropzone
  } = useDropzone({
    onDrop: uploadBrandSlides,
    accept: imageAccept,
    maxSize: 10 * 1024 * 1024,
    maxFiles: MAX_BRAND_SLIDES,
    noClick: true,
    noKeyboard: true
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
                    <div className="form-group full-width">
                      <label>Upload Images (Optional)</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setDesignForm({ ...designForm, files: Array.from(e.target.files) })}
                        style={{ padding: '0.65rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}
                      />
                      {designForm.files?.length > 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-accent-cyan)', marginTop: '0.5rem', display: 'block' }}>
                          {designForm.files.length} file(s) selected to upload and save
                        </span>
                      )}
                    </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={resetDesignForm}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? <><Loader2 className="spinning" size={18} /> {designForm.files?.length > 0 ? 'Uploading & Saving...' : 'Saving...'}</> : <><Upload size={18} /> {designForm.files?.length > 0 ? 'Upload & Save Project' : 'Save Project'}</>}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div {...getGraphicRootProps()} style={{ display: 'none' }}>
                    <input id="graphic-upload-input" {...getGraphicInputProps()} />
                  </div>

                  <div className="projects-list">
                    {designProjects.map((project) => (
                      <div key={project.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                      <motion.div
                        className={`project-card glass-card-static ${String(selectedDesignProjectId) === String(project.id) ? 'selected' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ cursor: 'pointer', marginBottom: 0 }}
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
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDesignProjectId(String(project.id));
                              openGraphicDropzone();
                            }}
                            title="Upload Images"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDesignForm(project);
                            }}
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDesignProject(project.id);
                            }}
                            className="delete"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {String(selectedDesignProjectId) === String(project.id) && (
                          <motion.div
                            key="graphic-details"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="glass-card-static" style={{ padding: '1.25rem', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h5 style={{ margin: 0, fontSize: '1rem' }}>Project Images</h5>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  {isUploadingGraphic && String(activeDesignProject?.id) === String(project.id) && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Loader2 size={14} className="spinning" /> Uploading...
                                    </span>
                                  )}
                                  <button type="button" className="btn-primary" onClick={() => openGraphicDropzone()} disabled={isUploadingGraphic}>
                                    <Upload size={16} />
                                    Upload Images
                                  </button>
                                </div>
                              </div>

                              <div {...getGraphicRootProps()} className={`dropzone ${isGraphicDragActive ? 'active' : ''} ${isUploadingGraphic ? 'uploading' : ''}`} style={{ marginBottom: '1.5rem', minHeight: '120px', padding: '1.5rem', cursor: 'pointer' }}>
                                <input {...getGraphicInputProps()} />
                                {isUploadingGraphic ? (
                                  <div style={{ textAlign: 'center' }}>
                                    <Loader2 className="spinning" size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--color-accent-cyan)' }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Uploading...</p>
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center' }}>
                                    <Upload size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Drag & drop graphic images here, or <strong>click to select files</strong></p>
                                  </div>
                                )}
                              </div>

                              <div className="file-grid">
                                {(project.images || []).length > 0 ? (
                                  project.images.map((image) => (
                                    <motion.div key={image.id} className="file-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                      <div className="file-preview">
                                        <img src={image.url} alt={`${project.name} design`} />
                                      </div>
                                      <div className="file-actions">
                                        <button className="file-action-btn delete" onClick={() => deleteGraphicImage(project.id, image.id)}>
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '2rem 0' }}>
                                    <Image size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No images uploaded yet. Click the upload button above to add.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </div>
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
                    <div className="form-group full-width">
                      <label>Upload Brand Slides (Optional)</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setBrandForm({ ...brandForm, files: Array.from(e.target.files) })}
                        style={{ padding: '0.65rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}
                      />
                      {brandForm.files?.length > 0 && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-accent-cyan)', marginTop: '0.5rem', display: 'block' }}>
                          {brandForm.files.length} file(s) selected to upload and save
                        </span>
                      )}
                    </div>
                      </div>

                      <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={resetBrandForm}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? <><Loader2 className="spinning" size={18} /> {brandForm.files?.length > 0 ? 'Uploading & Saving...' : 'Saving...'}</> : <><Upload size={18} /> {brandForm.files?.length > 0 ? 'Upload & Save Project' : 'Save Project'}</>}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="projects-list">
                    {brandProjects.map((project) => (
                      <div key={project.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                      <motion.div
                        className={`project-card glass-card-static ${String(selectedBrandProjectId) === String(project.id) ? 'selected' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ cursor: 'pointer', marginBottom: 0 }}
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
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBrandProjectId(String(project.id));
                              openBrandDropzone();
                            }}
                            title="Upload Slides"
                          >
                            <Upload size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditBrandForm(project);
                            }}
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBrandProject(project.id);
                            }}
                            className="delete"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {String(selectedBrandProjectId) === String(project.id) && (
                          <motion.div
                            key="brand-details"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="glass-card-static" style={{ padding: '1.25rem', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h5 style={{ margin: 0, fontSize: '1rem' }}>Brand Slides</h5>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  {isUploadingBrand && String(activeBrandProject?.id) === String(project.id) && (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Loader2 size={14} className="spinning" /> Uploading...
                                    </span>
                                  )}
                                  <button type="button" className="btn-primary" onClick={() => openBrandDropzone()} disabled={isUploadingBrand}>
                                    <Upload size={16} />
                                    Upload Slides
                                  </button>
                                </div>
                              </div>

                              <div {...getBrandRootProps()} className={`dropzone ${isBrandDragActive ? 'active' : ''} ${isUploadingBrand ? 'uploading' : ''}`} style={{ marginBottom: '1.5rem', minHeight: '120px', padding: '1.5rem', cursor: 'pointer' }}>
                                <input {...getBrandInputProps()} />
                                {isUploadingBrand ? (
                                  <div style={{ textAlign: 'center' }}>
                                    <Loader2 className="spinning" size={32} style={{ margin: '0 auto 0.5rem', color: 'var(--color-accent-cyan)' }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Uploading...</p>
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center' }}>
                                    <Upload size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>Drag & drop brand slides here, or <strong>click to select files</strong></p>
                                  </div>
                                )}
                              </div>

                              <div className="brand-slides-container" style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '1rem', scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent-cyan) rgba(255,255,255,0.05)' }}>
                                {(project.images || []).length > 0 ? (
                                  project.images.map((image, index) => (
                                    <motion.div key={image.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ flex: '0 0 auto', width: '220px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                      <img src={image.url} alt={`${project.name} slide ${index + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                                        Slide {index + 1}
                                      </div>
                                      <button
                                        onClick={() => deleteBrandSlide(project.id, image.id)}
                                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                                        title="Delete Slide"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </motion.div>
                                  ))
                                ) : (
                                  <div className="empty-state" style={{ width: '100%', padding: '2rem 0' }}>
                                    <Palette size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No slides uploaded yet. Use the upload area above to add some.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </div>
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
                      <label>Project Screenshot (Upload)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setWebForm({ ...webForm, file: e.target.files[0] })}
                        style={{ padding: '0.65rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}
                      />
                      {webForm.image && !webForm.file && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                          Current image is saved. Uploading a new one will replace it.
                        </span>
                      )}
                      {webForm.file && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-accent-cyan)', marginTop: '0.5rem', display: 'block' }}>
                          1 file selected for upload
                        </span>
                      )}
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
                      {isSaving ? <><Loader2 className="spinning" size={18} /> {webForm.file ? 'Uploading & Saving...' : 'Saving...'}</> : <><Upload size={18} /> {webForm.file ? 'Upload & Save App' : 'Save App'}</>}
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
