import imageCompression from 'browser-image-compression'
import type { SupabaseClient } from '@supabase/supabase-js'

// M-C7: Shared photo upload pipeline (was duplicated in new-dog-form.tsx
// and edit-form.tsx with identical compression settings and bucket).
export async function uploadDogPhoto(
  supabase: SupabaseClient,
  photo: File
): Promise<{ url: string | null; error: string | null }> {
  try {
    const folderId = crypto.randomUUID()
    const fileName = `${folderId}/${photo.name}`
    const compressed = await imageCompression(photo, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    })
    const { error: uploadError } = await supabase.storage
      .from('dog-photos')
      .upload(fileName, compressed)
    if (uploadError) {
      return { url: null, error: uploadError.message }
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('dog-photos').getPublicUrl(fileName)
    return { url: publicUrl, error: null }
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : 'Upload failed' }
  }
}
