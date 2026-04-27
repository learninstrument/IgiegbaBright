/**
 * Portfolio Backend Server
 * Handles contact form submissions via Nodemailer
 * Handles project file uploads to Supabase Cloud Storage
 * Uses Supabase for reliable, scalable file storage
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { uploadToSupabase, deleteFromSupabase, listFiles, getSignedUploadUrl, supabase } = require('./supabase-upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directories if they don't exist (only in development)
// Skip on Vercel/serverless environments to avoid permission errors
if (process.env.NODE_ENV !== 'production') {
  const uploadDirs = ['uploads', 'uploads/projects', 'uploads/profile', 'data'];
  uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      console.warn(`Could not create directory ${dir}:`, error.message);
    }
  });
}

// Initialize web projects JSON file (skip on serverless)
let webProjectsFile;
if (process.env.NODE_ENV !== 'production') {
  webProjectsFile = path.join(__dirname, 'data', 'webprojects.json');
  try {
    if (!fs.existsSync(webProjectsFile)) {
      fs.writeFileSync(webProjectsFile, JSON.stringify([], null, 2));
    }
  } catch (error) {
    console.warn('Could not initialize webprojects file:', error.message);
  }
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = new Set([
  'http://localhost:5173',
  'https://igiegbabright.vercel.app',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
]);

const isAllowedLocalOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
const isAllowedVercelOrigin = (origin) => /^https:\/\/igiegbabright(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.has(origin) || isAllowedLocalOrigin(origin) || isAllowedVercelOrigin(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Preflight handler
app.options('*', cors(corsOptions));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Always serve fresh API data so new deployments and latest project updates appear immediately.
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many contact requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: 'Too many uploads. Please try again later.'
  }
});

// Multer configuration for file uploads (memory storage for Supabase)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  const allowedDocumentTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
  const allowedCodeTypes = ['application/json', 'text/plain', 'text/html', 'text/css', 'application/javascript', 'text/javascript'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocumentTypes, ...allowedCodeTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP, SVG), videos (MP4, WebM, OGG), documents (PDF, ZIP), and code files (JSON, JS, HTML, CSS, TXT).'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10 // Max 10 files per upload
  }
});

// Nodemailer transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Validation rules for contact form
const contactValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters')
    .escape()
];

// ========================
// API ROUTES
// ========================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Upload single file to Supabase
app.post('/api/upload/:type', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const bucket = req.params.type || 'project';
    const result = await uploadToSupabase(req.file.buffer, req.file.originalname, bucket);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Upload failed'
      });
    }

    console.log(`File uploaded: ${result.originalName} -> ${result.url}`);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: result.filename,
        originalName: result.originalName,
        url: result.url,
        size: result.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

// Upload multiple files to Supabase
app.post('/api/upload/:type/multiple', uploadLimiter, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const bucket = req.params.type || 'project';
    const uploadedFiles = [];

    for (const file of req.files) {
      const result = await uploadToSupabase(file.buffer, file.originalname, bucket);
      if (result.success) {
        uploadedFiles.push({
          filename: result.filename,
          originalName: result.originalName,
          url: result.url,
          size: result.size
        });
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload files'
      });
    }

    console.log(`${uploadedFiles.length} files uploaded to Supabase`);

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload files'
    });
  }
});

// Get list of uploaded files from Supabase
app.get('/api/uploads/:type', async (req, res) => {
  try {
    const bucket = req.params.type || 'project';
    const files = await listFiles(bucket);

    res.status(200).json({
      success: true,
      files
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files'
    });
  }
});

// Get signed upload URL for direct Supabase upload
// Allows large file uploads by bypassing Vercel's 6MB limit
app.post('/api/get-signed-url/:type', async (req, res) => {
  try {
    console.log('DEBUG: /api/get-signed-url/:type endpoint called');
    console.log('DEBUG: params.type:', req.params.type);
    console.log('DEBUG: body:', req.body);

    const { fileName } = req.body;
    const bucket = req.params.type || 'project';

    if (!fileName) {
      console.log('DEBUG: No fileName provided');
      return res.status(400).json({
        success: false,
        message: 'File name is required'
      });
    }

    console.log('DEBUG: Calling getSignedUploadUrl with:', { fileName, bucket });
    const result = await getSignedUploadUrl(fileName, bucket);
    console.log('DEBUG: getSignedUploadUrl result:', result);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to generate signed URL'
      });
    }

    res.status(200).json({
      success: true,
      signedUrl: result.signedUrl,
      path: result.path,
      originalName: result.originalName
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate signed URL'
    });
  }
});

// Delete file from Supabase
app.delete('/api/upload/:type/:filename', async (req, res) => {
  try {
    const bucket = req.params.type || 'project';
    const result = await deleteFromSupabase(req.params.filename, bucket);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to delete file'
      });
    }

    console.log(`File deleted from Supabase: ${req.params.filename}`);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

// ========================
// WEB PROJECTS API
// ========================

// Get all web projects
app.get('/api/webprojects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('web_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch projects'
      });
    }

    res.status(200).json({
      success: true,
      projects: data || []
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
});

// Add new web project
app.post('/api/webprojects', async (req, res) => {
  try {
    const { name, description, image, liveUrl, githubUrl, technologies, featured, year } = req.body;

    console.log('POST /api/webprojects - Received:', { name, description, image, liveUrl, githubUrl, technologies, featured, year });

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    console.log('Inserting into Supabase...');
    const { data, error } = await supabase
      .from('web_projects')
      .insert([{
        name,
        description: description || '',
        image: image || '',
        liveUrl: liveUrl || '',
        githubUrl: githubUrl || '',
        technologies: technologies || [],
        featured: featured || false,
        year: year || new Date().getFullYear()
      }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create project',
        error: error.message
      });
    }

    console.log('Insert successful:', data);
    res.status(201).json({
      success: true,
      message: 'Project added successfully',
      project: data[0]
    });
  } catch (error) {
    console.error('Add project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// Update web project
app.put('/api/webprojects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, liveUrl, githubUrl, technologies, featured, year } = req.body;

    const { data, error } = await supabase
      .from('web_projects')
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        image: image !== undefined ? image : undefined,
        liveUrl: liveUrl !== undefined ? liveUrl : undefined,
        githubUrl: githubUrl !== undefined ? githubUrl : undefined,
        technologies: technologies !== undefined ? technologies : undefined,
        featured: featured !== undefined ? featured : undefined,
        year: year !== undefined ? year : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update project'
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: data[0]
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
});

// Delete web project
app.delete('/api/webprojects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('web_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete project'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

// ========================
// DESIGN PROJECTS API
// ========================

// Get all design projects
app.get('/api/design-projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('design_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch design projects'
      });
    }

    res.status(200).json({
      success: true,
      projects: data || []
    });
  } catch (error) {
    console.error('Get design projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch design projects'
    });
  }
});

// Add new design project
app.post('/api/design-projects', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    const { data, error } = await supabase
      .from('design_projects')
      .insert([{
        name,
        description: description || '',
        images: []
      }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create design project',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Design project created',
      project: data[0]
    });
  } catch (error) {
    console.error('Add design project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create design project'
    });
  }
});

// Update design project
app.put('/api/design-projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, images } = req.body;

    const { data, error } = await supabase
      .from('design_projects')
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        images: images !== undefined ? images : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update design project'
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Design project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Design project updated',
      project: data[0]
    });
  } catch (error) {
    console.error('Update design project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update design project'
    });
  }
});

// Delete design project
app.delete('/api/design-projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('design_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete design project'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Design project deleted'
    });
  } catch (error) {
    console.error('Delete design project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete design project'
    });
  }
});

// ========================
// BRAND PROJECTS API
// ========================

// Get all brand projects
app.get('/api/brand-projects', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('brand_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch brand projects'
      });
    }

    res.status(200).json({
      success: true,
      projects: data || []
    });
  } catch (error) {
    console.error('Get brand projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand projects'
    });
  }
});

// Add new brand project
app.post('/api/brand-projects', async (req, res) => {
  try {
    const { name, description, images } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    const safeImages = Array.isArray(images) ? images : [];
    if (safeImages.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'A brand identity project can have a maximum of 15 slides'
      });
    }

    const { data, error } = await supabase
      .from('brand_projects')
      .insert([{
        name,
        description: description || '',
        images: safeImages
      }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create brand project',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Brand project created',
      project: data[0]
    });
  } catch (error) {
    console.error('Add brand project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create brand project'
    });
  }
});

// Update brand project
app.put('/api/brand-projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, images } = req.body;

    if (images !== undefined && (!Array.isArray(images) || images.length > 15)) {
      return res.status(400).json({
        success: false,
        message: 'A brand identity project can have between 0 and 15 slides'
      });
    }

    const { data, error } = await supabase
      .from('brand_projects')
      .update({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        images: images !== undefined ? images : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update brand project'
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Brand project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Brand project updated',
      project: data[0]
    });
  } catch (error) {
    console.error('Update brand project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update brand project'
    });
  }
});

// Delete brand project
app.delete('/api/brand-projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('brand_projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete brand project'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Brand project deleted'
    });
  } catch (error) {
    console.error('Delete brand project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete brand project'
    });
  }
});

// ========================
// PROJECT BRANDING API
// ========================

// Get project branding
app.get('/api/branding', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('project_branding')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch branding'
      });
    }

    res.status(200).json({
      success: true,
      branding: data || null
    });
  } catch (error) {
    console.error('Get branding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branding'
    });
  }
});

// Create or update project branding
app.post('/api/branding', async (req, res) => {
  try {
    const { projectName, projectDescription, brandAssets } = req.body;

    if (!projectName) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    // Try to get existing branding
    const { data: existing } = await supabase
      .from('project_branding')
      .select('id')
      .single();

    let result;
    if (existing) {
      // Update existing
      result = await supabase
        .from('project_branding')
        .update({
          projectName,
          projectDescription: projectDescription || '',
          brandAssets: brandAssets || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select();
    } else {
      // Insert new
      result = await supabase
        .from('project_branding')
        .insert([{
          projectName,
          projectDescription: projectDescription || '',
          brandAssets: brandAssets || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
    }

    const { data, error } = result;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save branding',
        error: error.message
      });
    }

    res.status(existing ? 200 : 201).json({
      success: true,
      message: existing ? 'Branding updated' : 'Branding created',
      branding: data[0]
    });
  } catch (error) {
    console.error('Save branding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save branding'
    });
  }
});

// Add brand asset
app.post('/api/branding/assets', async (req, res) => {
  try {
    const { imageUrl, assetType, description } = req.body;

    if (!imageUrl || !assetType) {
      return res.status(400).json({
        success: false,
        message: 'Image URL and asset type are required'
      });
    }

    // Get existing branding
    const { data: branding } = await supabase
      .from('project_branding')
      .select('*')
      .single();

    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found. Create branding first.'
      });
    }

    const newAsset = {
      id: uuidv4(),
      imageUrl,
      assetType,
      description: description || '',
      uploadedAt: new Date().toISOString()
    };

    const updatedAssets = [...(branding.brandAssets || []), newAsset];

    const { data, error } = await supabase
      .from('project_branding')
      .update({ brandAssets: updatedAssets })
      .eq('id', branding.id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to add asset'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Asset added',
      branding: data[0]
    });
  } catch (error) {
    console.error('Add asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add asset'
    });
  }
});

// Delete brand asset
app.delete('/api/branding/assets/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    // Get existing branding
    const { data: branding } = await supabase
      .from('project_branding')
      .select('*')
      .single();

    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found'
      });
    }

    const updatedAssets = (branding.brandAssets || []).filter(asset => asset.id !== assetId);

    const { data, error } = await supabase
      .from('project_branding')
      .update({ brandAssets: updatedAssets })
      .eq('id', branding.id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete asset'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Asset deleted',
      branding: data[0]
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset'
    });
  }
});

// Contact form endpoint
app.post('/api/contact', contactLimiter, contactValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { name, email, message } = req.body;

    const mailOptions = {
      from: `"Portfolio Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL || process.env.SMTP_USER,
      replyTo: email,
      subject: `New Portfolio Contact: ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #495057; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .value { margin-top: 5px; color: #212529; font-size: 16px; line-height: 1.6; }
            .footer { background: #212529; color: #adb5bd; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">New Contact Message</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone reached out through your portfolio</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">From</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email</div>
                <div class="value"><a href="mailto:${email}" style="color: #667eea;">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">
                  <div class="value">${message.replace(/\n/g, '<br>')}</div>
                </div>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0;">Sent from your Portfolio Contact Form</p>
              <p style="margin: 5px 0 0 0;">${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Contact Message from Portfolio

From: ${name}
Email: ${email}

Message:
${message}

---
Sent: ${new Date().toLocaleString()}
      `
    };

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n========================================');
      console.log('CONTACT FORM SUBMISSION (Dev Mode)');
      console.log('========================================');
      console.log(`Name: ${name}`);
      console.log(`Email: ${email}`);
      console.log(`Message: ${message}`);
      console.log(`Time: ${new Date().toLocaleString()}`);
      console.log('========================================\n');

      return res.status(200).json({
        success: true,
        message: 'Message received! (Development mode - Email not sent)',
        devMode: true
      });
    }

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);

    console.log(`Contact form submitted by ${name} (${email})`);

    res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been sent successfully.'
    });

  } catch (error) {
    console.error('Contact form error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later or contact me directly via email.'
    });
  }
});

// Handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per upload.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  PORTFOLIO BACKEND SERVER                  ║
╠═══════════════════════════════════════════════════════════╣
║  Status:  Running                                         ║
║  Port:    ${PORT}                                            ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                                   ║
║  SMTP:    ${process.env.SMTP_USER ? 'Configured' : 'Not configured (dev mode)'}                           ║
╠═══════════════════════════════════════════════════════════╣
║  UPLOAD ENDPOINTS:                                        ║
║  POST /api/upload/projects      - Single project file     ║
║  POST /api/upload/projects/multiple - Multiple files      ║
║  POST /api/upload/profile       - Profile picture         ║
║  GET  /api/uploads/:type        - List uploaded files     ║
║  DELETE /api/upload/:type/:file - Delete a file           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
