import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Image,
  Video,
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  User,
  Layers,
  Code2,
  Eye,
  ExternalLink,
  Github,
  Edit3,
  Palette
} from 'lucide-react'
import { uploadToSupabaseDirect, deleteFromSupabaseDirect, listFilesFromSupabase } from '../lib/supabaseClient'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const API_URL = `${API_BASE_URL}/api`

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('webapps')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [profileFiles, setProfileFiles] = useState([])
  const [webProjects, setWebProjects] = useState([])
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
  // Branding state
  const [branding, setBranding] = useState(null)
  const [brandingForm, setBrandingForm] = useState({
    projectName: '',
    projectDescription: ''
  })
  const [selectedAssetType, setSelectedAssetType] = useState('logo')
  const [assetDescription, setAssetDescription] = useState('')
  const [showBrandingForm, setShowBrandingForm] = useState(false)

  useEffect(() => {
    fetchUploadedFiles()
    fetchProfileFiles()
    fetchWebProjects()
    fetchBranding()
  }, [])

  const fetchUploadedFiles = async () => {
    try {
      const files = await listFilesFromSupabase('project')
      setUploadedFiles(files)
    } catch (error) {
      console.error('Failed to fetch files:', error)
    }
  }

  const fetchProfileFiles = async () => {
    try {
      const files = await listFilesFromSupabase('profile')
      setProfileFiles(files)
    } catch (error) {
      console.error('Failed to fetch profile files:', error)
    }
  }

  const fetchWebProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/webprojects`)
      const data = await res.json()
      if (data.success) setWebProjects(data.projects)
    } catch (error) {
      console.error('Failed to fetch web projects:', error)
    }
  }

  const fetchBranding = async () => {
    try {
      const res = await fetch(`${API_URL}/branding`)
      const data = await res.json()
      if (data.success && data.branding) {
        setBranding(data.branding)
        setBrandingForm({
          projectName: data.branding.projectName || '',
          projectDescription: data.branding.projectDescription || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const onDrop = useCallback(async (acceptedFiles, uploadType = 'project') => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)

    try {
      // Upload directly to Supabase (no Vercel involved!)
      for (const file of acceptedFiles) {
        const result = await uploadToSupabaseDirect(file, uploadType)

        if (!result.success) {
          showMessage('error', `Upload failed: ${result.error}`)
          continue
        }

        showMessage('success', `File uploaded: ${file.name}`)

        // Auto-fill image URL in form for single file
        if (acceptedFiles.length === 1 && uploadType === 'project' && showProjectForm) {
          setProjectForm(prev => ({ ...prev, image: result.url }))
        }
      }

      // Refresh file lists
      if (uploadType === 'project') {
        fetchUploadedFiles()
      } else {
        fetchProfileFiles()
      }
    } catch (error) {
      console.error('Upload error:', error)
      showMessage('error', 'Upload failed. Please try again.')
    }

    setIsUploading(false)
  }, [showProjectForm])

  const { getRootProps: getProjectRootProps, getInputProps: getProjectInputProps, isDragActive: isProjectDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, 'project'),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.webm', '.ogg'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'application/json': ['.json'],
      'text/plain': ['.txt'],
      'text/html': ['.html'],
      'text/css': ['.css'],
      'application/javascript': ['.js']
    },
    maxSize: 50 * 1024 * 1024
  })

  const { getRootProps: getProfileRootProps, getInputProps: getProfileInputProps, isDragActive: isProfileDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, 'profile'),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1
  })

  const deleteFile = async (type, filename) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    try {
      const result = await deleteFromSupabaseDirect(filename, type)
      if (result.success) {
        showMessage('success', 'File deleted')
        type === 'project' ? fetchUploadedFiles() : fetchProfileFiles()
      } else {
        showMessage('error', result.error || 'Failed to delete file')
      }
    } catch (error) {
      showMessage('error', 'Failed to delete file')
    }
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    const technologiesArray = projectForm.technologies.split(',').map(t => t.trim()).filter(t => t)

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
        showMessage('success', editingProject ? 'Project updated!' : 'Project added!')
        fetchWebProjects()
        resetProjectForm()
      } else {
        showMessage('error', data.message)
      }
    } catch (error) {
      showMessage('error', 'Failed to save project')
    }
    setIsSaving(false)
  }

  const editProject = (project) => {
    setEditingProject(project)
    setProjectForm({
      title: project.name || project.title || '',
      description: project.description,
      image: project.image,
      liveUrl: project.liveUrl || project.liveDemo || '',
      githubUrl: project.githubUrl || project.github || '',
      technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : (Array.isArray(project.tech) ? project.tech.join(', ') : '')
    })
    setShowProjectForm(true)
  }

  const deleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      const res = await fetch(`${API_URL}/webprojects/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Project deleted')
        fetchWebProjects()
      } else {
        showMessage('error', data.message)
      }
    } catch (error) {
      showMessage('error', 'Failed to delete project')
    }
  }

  const resetProjectForm = () => {
    setProjectForm({ title: '', description: '', image: '', liveUrl: '', githubUrl: '', technologies: '' })
    setEditingProject(null)
    setShowProjectForm(false)
  }

  const handleBrandingSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch(`${API_URL}/branding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: brandingForm.projectName,
          projectDescription: brandingForm.projectDescription,
          brandAssets: branding?.brandAssets || []
        })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Branding saved!')
        fetchBranding()
        setShowBrandingForm(false)
      } else {
        showMessage('error', data.message)
      }
    } catch (error) {
      showMessage('error', 'Failed to save branding')
    }
    setIsSaving(false)
  }

  const handleAddBrandAsset = async (file) => {
    if (!branding) {
      showMessage('error', 'Please save branding info first')
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

      // Add asset to branding
      const res = await fetch(`${API_URL}/branding/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: result.url,
          assetType: selectedAssetType,
          description: assetDescription
        })
      })

      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Brand asset added!')
        fetchBranding()
        setAssetDescription('')
      } else {
        showMessage('error', data.message)
      }
    } catch (error) {
      showMessage('error', 'Failed to add asset')
    }
    setIsUploading(false)
  }

  const deleteBrandAsset = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    try {
      const res = await fetch(`${API_URL}/branding/assets/${assetId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showMessage('success', 'Asset deleted')
        fetchBranding()
      } else {
        showMessage('error', data.message)
      }
    } catch (error) {
      showMessage('error', 'Failed to delete asset')
    }
  }

  const { getRootProps: getBrandRootProps, getInputProps: getBrandInputProps, isDragActive: isBrandDragActive } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0) handleAddBrandAsset(files[0])
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1
  })

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isVideo = (filename) => /\.(mp4|webm|ogg)$/i.test(filename)

  const assetTypes = [
    { value: 'logo', label: 'Logo' },
    { value: 'color-palette', label: 'Color Palette' },
    { value: 'typography', label: 'Typography' },
    { value: 'guidelines', label: 'Brand Guidelines' },
    { value: 'icon-set', label: 'Icon Set' },
    { value: 'other', label: 'Other' }
  ]

  const tabs = [
    { id: 'webapps', label: 'Web Apps', icon: <Code2 size={18} /> },
    { id: 'projects', label: 'Project Files', icon: <Layers size={18} /> },
    { id: 'branding', label: 'Project Branding', icon: <Palette size={18} /> },
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
            <p className="admin-subtitle">Upload and manage your portfolio content</p>
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
          {/* Web Apps Tab */}
          {activeTab === 'webapps' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">
                    <Code2 size={24} />
                    Web Application Projects
                  </h2>
                  <p className="admin-section-desc">
                    Add and manage your web application projects. These will appear on your portfolio.
                  </p>
                </div>
                {!showProjectForm && (
                  <button className="btn-primary" onClick={() => setShowProjectForm(true)}>
                    <Plus size={18} />
                    Add Project
                  </button>
                )}
              </div>

              {/* Project Form */}
              {showProjectForm && (
                <motion.form
                  className="project-form glass-card-static"
                  onSubmit={handleProjectSubmit}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="form-header">
                    <h3>{editingProject ? 'Edit Project' : 'Add New Project'}</h3>
                    <button type="button" className="close-btn" onClick={resetProjectForm}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Project Title *</label>
                      <input
                        type="text"
                        value={projectForm.title}
                        onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                        placeholder="ErrandKart"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Website URL</label>
                      <input
                        type="text"
                        value={projectForm.liveUrl}
                        onChange={(e) => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                        placeholder="errandkart.com"
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
                      <label>Screenshot URL (Upload an image first, then paste the URL here)</label>
                      <input
                        type="text"
                        value={projectForm.image}
                        onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })}
                        placeholder="/uploads/projects/your-image.jpg"
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

              {/* Projects List */}
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

          {/* Projects Files Tab */}
          {activeTab === 'projects' && (
            <div className="admin-section">
              <h2 className="admin-section-title">
                <FolderOpen size={24} />
                Project Images & Videos
              </h2>
              <p className="admin-section-desc">
                Upload screenshots for your web projects. After uploading, copy the URL and paste it in your project form.
              </p>

              <div
                {...getProjectRootProps()}
                className={`dropzone ${isProjectDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
              >
                <input {...getProjectInputProps()} />
                {isUploading ? (
                  <><Loader2 className="dropzone-icon spinning" size={48} /><p>Uploading...</p></>
                ) : isProjectDragActive ? (
                  <><Upload className="dropzone-icon" size={48} /><p>Drop files here...</p></>
                ) : (
                  <><Upload className="dropzone-icon" size={48} /><p>Drag & drop files here, or click to select</p><span className="dropzone-hint">Images & Videos (max 50MB)</span></>
                )}
              </div>

              <div className="file-grid">
                {uploadedFiles.map((file, index) => (
                  <motion.div key={file.filename} className="file-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                    <div className="file-preview">
                      {isVideo(file.filename) ? (
                        <video src={file.url} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                      ) : (
                        <img src={file.url} alt={file.filename} />
                      )}
                      <div className="file-type-badge">
                        {isVideo(file.filename) ? <Video size={14} /> : <Image size={14} />}
                      </div>
                    </div>
                    <div className="file-info">
                      <span className="file-name" title={file.filename}>{file.filename.substring(0, 15)}...</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="file-actions">
                      <button className="file-action-btn copy" onClick={() => { navigator.clipboard.writeText(file.url); showMessage('success', 'URL copied!') }}>Copy URL</button>
                      <button className="file-action-btn delete" onClick={() => deleteFile('project', file.filename)}><Trash2 size={16} /></button>
                    </div>
                  </motion.div>
                ))}
                {uploadedFiles.length === 0 && (
                  <div className="empty-state"><FolderOpen size={48} /><p>No files uploaded yet</p></div>
                )}
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <div>
                  <h2 className="admin-section-title">
                    <Palette size={24} />
                    Project Branding & Identity
                  </h2>
                  <p className="admin-section-desc">
                    Manage your project name, description, and upload brand identity assets like logos, color palettes, typography guides, and more.
                  </p>
                </div>
                {!showBrandingForm && (
                  <button className="btn-primary" onClick={() => setShowBrandingForm(true)}>
                    <Plus size={18} />
                    Edit Branding
                  </button>
                )}
              </div>

              {/* Branding Form */}
              {showBrandingForm && (
                <motion.form
                  className="project-form glass-card-static"
                  onSubmit={handleBrandingSubmit}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="form-header">
                    <h3>Edit Project Branding</h3>
                    <button type="button" className="close-btn" onClick={() => setShowBrandingForm(false)}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Project Name *</label>
                      <input
                        type="text"
                        value={brandingForm.projectName}
                        onChange={(e) => setBrandingForm({ ...brandingForm, projectName: e.target.value })}
                        placeholder="My Awesome Project"
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Project Description</label>
                      <textarea
                        value={brandingForm.projectDescription}
                        onChange={(e) => setBrandingForm({ ...brandingForm, projectDescription: e.target.value })}
                        placeholder="Describe your project and its purpose..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowBrandingForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? <><Loader2 className="spinning" size={18} /> Saving...</> : <><Save size={18} /> Save Branding</>}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Display Branding Info */}
              {branding && !showBrandingForm && (
                <motion.div
                  className="glass-card-static"
                  style={{ marginBottom: '30px', padding: '24px' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <h3 style={{ marginTop: 0 }}>{branding.projectName}</h3>
                  <p style={{ color: '#a0aec0', whiteSpace: 'pre-wrap' }}>{branding.projectDescription || 'No description provided'}</p>
                </motion.div>
              )}

              {/* Brand Assets Upload */}
              <div className="glass-card-static" style={{ marginBottom: '30px', padding: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Upload Brand Asset</h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Asset Type</label>
                    <select
                      value={selectedAssetType}
                      onChange={(e) => setSelectedAssetType(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#fff',
                        color: '#333',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {assetTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <input
                      type="text"
                      value={assetDescription}
                      onChange={(e) => setAssetDescription(e.target.value)}
                      placeholder="e.g., Main logo, Dark mode version"
                    />
                  </div>
                </div>

                <div {...getBrandRootProps()} className={`dropzone ${isBrandDragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}>
                  <input {...getBrandInputProps()} />
                  {isUploading ? (
                    <><Loader2 className="dropzone-icon spinning" size={48} /><p>Uploading...</p></>
                  ) : isBrandDragActive ? (
                    <><Upload className="dropzone-icon" size={48} /><p>Drop image here...</p></>
                  ) : (
                    <><Upload className="dropzone-icon" size={48} /><p>Drag & drop brand asset here, or click to select</p><span className="dropzone-hint">Image only (max 10MB)</span></>
                  )}
                </div>
              </div>

              {/* Brand Assets Gallery */}
              <div className="admin-section">
                <h3>Brand Assets ({(branding?.brandAssets || []).length})</h3>
                <div className="file-grid">
                  {branding?.brandAssets && branding.brandAssets.length > 0 ? (
                    branding.brandAssets.map((asset) => (
                      <motion.div
                        key={asset.id}
                        className="file-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="file-preview">
                          <img src={asset.imageUrl} alt={asset.assetType} style={{ objectFit: 'cover' }} />
                          <div className="file-type-badge" style={{ backgroundColor: '#667eea' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>
                              {assetTypes.find(t => t.value === asset.assetType)?.label || asset.assetType}
                            </span>
                          </div>
                        </div>
                        <div className="file-info">
                          <span className="file-name" title={asset.description}>{asset.description || asset.assetType}</span>
                          <span className="file-size" style={{ fontSize: '12px', color: '#999' }}>
                            {new Date(asset.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="file-actions">
                          <button
                            className="file-action-btn delete"
                            onClick={() => deleteBrandAsset(asset.id)}
                            title="Delete asset"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                      <Palette size={48} />
                      <p>No brand assets uploaded yet. Upload images to start building your brand identity.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
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
                      <button className="file-action-btn delete" onClick={() => deleteFile('profile', file.filename)}><Trash2 size={16} /></button>
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
