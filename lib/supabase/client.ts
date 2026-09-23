import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urkzepctwnldnqlkklvv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const BUCKET_NAME = 'product-attachments';

/**
 * Uploads a file buffer to Supabase Storage in the 'product-attachments' bucket.
 * Returns the public URL, or null if Supabase is not configured or upload fails.
 */
export async function uploadToSupabaseStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ publicUrl: string; path: string } | null> {
  if (!supabase) {
    return null;
  }

  try {
    // 1. Check or auto-create public bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 25 * 1024 * 1024, // 25MB
      });
    }

    // 2. Upload file
    const ext = fileName.split('.').pop() || '';
    const cleanBase = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const storagePath = `${Date.now()}-${cleanBase}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return null;
    }

    // 3. Get Public URL
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    return {
      publicUrl: data.publicUrl,
      path: storagePath,
    };
  } catch (err) {
    console.error('Failed to upload to Supabase storage:', err);
    return null;
  }
}
