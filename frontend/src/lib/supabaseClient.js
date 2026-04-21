import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Upload file directly to Supabase
 * @param {File} file - File to upload
 * @param {string} bucket - Bucket name ('project' or 'profile')
 * @returns {Promise<{success, url, error}>}
 */
export const uploadToSupabaseDirect = async (file, bucket = 'project') => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}-${random}.${ext}`;

    // Upload file directly to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
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
      .from(bucket)
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
    console.log('Attempting to delete:', { filename, bucket });

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filename]);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('File deleted successfully:', filename);
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
    console.log('Listing files from bucket:', bucket);

    const { data, error } = await supabase.storage
      .from(bucket)
      .list();

    if (error) {
      console.error('Supabase list error:', error);
      return [];
    }

    console.log(`Found ${data.length} files in ${bucket}:`, data);

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

    console.log('Files with URLs:', filesWithUrls);
    return filesWithUrls;
  } catch (error) {
    console.error('List error:', error);
    return [];
  }
};
