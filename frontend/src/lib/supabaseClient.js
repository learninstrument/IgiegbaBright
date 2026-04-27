import { createClient } from '@supabase/supabase-js';
import { fetchApi } from './apiClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasDirectSupabaseAccess = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!hasDirectSupabaseAccess) {
  console.error('Missing Supabase environment variables');
}

export const supabase = hasDirectSupabaseAccess
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const normalizeBucket = (bucket = 'project') => {
  const normalized = String(bucket || 'project').toLowerCase();
  if (normalized === 'brand' || normalized === 'projects') return 'project';
  if (normalized === 'profiles') return 'profile';
  return normalized;
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const extractFilename = (value = '') => {
  if (!value) return '';
  if (typeof value !== 'string') return '';

  if (!value.startsWith('http')) return value;

  try {
    const path = new URL(value).pathname || '';
    return decodeURIComponent(path.split('/').pop() || '');
  } catch {
    return value;
  }
};

/**
 * Upload file directly to Supabase
 * @param {File} file - File to upload
 * @param {string} bucket - Bucket name ('project' or 'profile')
 * @param {{category?: string}} options - Optional upload metadata
 * @returns {Promise<{success, url, error}>}
 */
export const uploadToSupabaseDirect = async (file, bucket = 'project', options = {}) => {
  try {
    const normalizedBucket = normalizeBucket(bucket);

    if (!hasDirectSupabaseAccess) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchApi(`/upload/${normalizedBucket}`, {
        method: 'POST',
        body: formData
      });
      const payload = await parseJsonSafe(response);

      if (!response.ok || !payload.success) {
        return {
          success: false,
          error: payload.message || 'Upload failed'
        };
      }

      return {
        success: true,
        url: payload.file?.url,
        filename: payload.file?.filename
      };
    }

    const sanitizeFilePart = (value = '') => value
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    const originalNamePart = sanitizeFilePart(file.name) || 'file';
    const categoryPrefix = options?.category ? `${sanitizeFilePart(options.category)}-` : '';
    const uniqueFileName = `${categoryPrefix}${timestamp}-${random}-${originalNamePart}${ext ? `.${ext}` : ''}`;

    // Upload file directly to Supabase
    const { error } = await supabase.storage
      .from(normalizedBucket)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(normalizedBucket)
      .getPublicUrl(uniqueFileName);

    return {
      success: true,
      url: publicData.publicUrl,
      filename: uniqueFileName
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
 * Delete file directly from Supabase
 * @param {string} filename - Filename to delete
 * @param {string} bucket - Bucket name ('project' or 'profile')
 * @returns {Promise<{success, error}>}
 */
export const deleteFromSupabaseDirect = async (filename, bucket = 'project') => {
  try {
    const normalizedBucket = normalizeBucket(bucket);
    const targetFilename = extractFilename(filename);

    if (!targetFilename) {
      return {
        success: false,
        error: 'Invalid filename'
      };
    }

    if (!hasDirectSupabaseAccess) {
      const response = await fetchApi(`/upload/${normalizedBucket}/${encodeURIComponent(targetFilename)}`, {
        method: 'DELETE'
      });
      const payload = await parseJsonSafe(response);

      if (!response.ok || !payload.success) {
        return {
          success: false,
          error: payload.message || 'Failed to delete file'
        };
      }

      return {
        success: true
      };
    }

    console.log('Attempting to delete:', { filename: targetFilename, bucket: normalizedBucket });

    const { error } = await supabase.storage
      .from(normalizedBucket)
      .remove([targetFilename]);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('File deleted successfully:', targetFilename);
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
 * List files directly from Supabase
 * @param {string} bucket - Bucket name ('project' or 'profile')
 * @returns {Promise<Array>}
 */
export const listFilesFromSupabase = async (bucket = 'project') => {
  try {
    const normalizedBucket = normalizeBucket(bucket);

    if (!hasDirectSupabaseAccess) {
      const response = await fetchApi(`/uploads/${normalizedBucket}`);
      const payload = await parseJsonSafe(response);
      if (!response.ok || !payload.success) {
        return [];
      }
      return payload.files || [];
    }

    console.log('Listing files from bucket:', normalizedBucket);

    const { data, error } = await supabase.storage
      .from(normalizedBucket)
      .list();

    if (error) {
      console.error('Supabase list error:', error);
      return [];
    }

    console.log(`Found ${data.length} files in ${normalizedBucket}:`, data);

    // Get public URLs for each file
    const filesWithUrls = data.map(file => {
      const { data: publicData } = supabase.storage
        .from(normalizedBucket)
        .getPublicUrl(file.name);

      return {
        filename: file.name,
        url: publicData.publicUrl,
        size: file.metadata?.size || 0,
        uploadedAt: file.created_at
      };
    });

    console.log('Files with URLs:', filesWithUrls);
    return filesWithUrls;
  } catch (error) {
    console.error('List error:', error);
    return [];
  }
};
