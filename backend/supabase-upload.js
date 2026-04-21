/**
 * Supabase Upload Utility
 * Handles file uploads to Supabase Cloud Storage
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Upload file to Supabase
 * @param {Buffer} fileBuffer - File data
 * @param {string} fileName - Original filename
 * @param {string} bucket - Bucket name ('project' or 'profile')
 * @returns {Promise<{success, url, error}>}
 */
const uploadToSupabase = async (fileBuffer, fileName, bucket = 'project') => {
  try {
    // Generate unique filename
    const ext = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${ext}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, fileBuffer, {
        contentType: getContentType(ext),
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Generate public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFileName);

    console.log(`File uploaded to Supabase: ${uniqueFileName}`);

    return {
      success: true,
      filename: uniqueFileName,
      originalName: fileName,
      url: publicData.publicUrl,
      size: fileBuffer.length
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete file from Supabase
 * @param {string} fileName - Filename to delete
 * @param {string} bucket - Bucket name
 * @returns {Promise<{success, error}>}
 */
const deleteFromSupabase = async (fileName, bucket = 'project') => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log(`File deleted from Supabase: ${fileName}`);

    return {
      success: true
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * List files in bucket
 * @param {string} bucket - Bucket name
 * @returns {Promise<Array>}
 */
const listFiles = async (bucket = 'project') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list();

    if (error) {
      console.error('List error:', error);
      return [];
    }

    // Get public URLs for each file
    const filesWithUrls = data.map(file => {
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(file.name);

      return {
        filename: file.name,
        url: publicData.publicUrl,
        size: file.metadata?.size || 0,
        uploadedAt: file.created_at
      };
    });

    return filesWithUrls;
  } catch (error) {
    console.error('List error:', error);
    return [];
  }
};

/**
 * Get content type from file extension
 */
const getContentType = (ext) => {
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    pdf: 'application/pdf',
    zip: 'application/zip',
    json: 'application/json',
    js: 'application/javascript',
    html: 'text/html',
    css: 'text/css',
    txt: 'text/plain'
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
};

/**
 * Generate a signed URL for direct upload to Supabase
 * @param {string} fileName - Original filename
 * @param {string} bucket - Bucket name ('project' or 'profile')
 * @returns {Promise<{success, signedUrl, path, error}>}
 */
/**
 * Generate a signed URL for direct upload to Supabase
 * @param {string} fileName - Original filename
 * @param {string} bucket - Bucket name ('project' or 'profile')
 * @returns {Promise<{success, signedUrl, path, error}>}
 */
const getSignedUploadUrl = async (fileName, bucket = 'project') => {
  try {
    console.log('DEBUG: getSignedUploadUrl called with:', { fileName, bucket });

    // Generate unique filename
    const ext = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${ext}`;
    console.log('DEBUG: Generated uniqueFileName:', uniqueFileName);

    // For now, return a simple response indicating upload should proceed
    // The frontend will upload directly to a public Supabase bucket
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${uniqueFileName}`;

    console.log('DEBUG: Returning public URL:', publicUrl);

    return {
      success: true,
      signedUrl: publicUrl,
      path: uniqueFileName,
      originalName: fileName
    };
  } catch (error) {
    console.error('Signed URL generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  supabase,
  uploadToSupabase,
  deleteFromSupabase,
  listFiles,
  getSignedUploadUrl
};
