'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/security/auth'
import { revalidatePath } from 'next/cache'

/**
 * Upsert a safety dictionary row (title, instructions, emoji).
 */
export async function upsertDictionaryRow(formData: FormData) {
  const { operator } = await requireAdmin('admin')
  const supabase = createServiceClient()

  const topicKey = formData.get('topic_key') as string
  const languageCode = formData.get('language_code') as string
  const title = formData.get('title') as string
  const instructions = formData.get('instructions') as string

  if (!topicKey || !languageCode || !title || !instructions) {
    return { error: 'All fields are required' }
  }

  const { error } = await supabase
    .from('global_safety_dictionary')
    .upsert(
      {
        topic_key: topicKey,
        language_code: languageCode,
        title,
        instructions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'topic_key,language_code' }
    )

  if (error) {
    console.error('[upsertDictionaryRow]', error)
    return { error: error.message }
  }

  revalidatePath('/admin/safety')
  return { success: true }
}

/**
 * Upload a default image for a safety topic.
 */
export async function uploadSafetyImage(formData: FormData) {
  const { operator } = await requireAdmin('admin')
  const supabase = createServiceClient()

  const topicKey = formData.get('topic_key') as string
  const languageCode = formData.get('language_code') as string
  const file = formData.get('file') as File

  if (!topicKey || !file || file.size === 0) {
    return { error: 'Topic key and image are required' }
  }

  const ext = file.name.split('.').pop() ?? 'webp'
  const path = `images/${topicKey}_${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('safety-assets')
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('[uploadSafetyImage]', uploadError)
    return { error: uploadError.message }
  }

  // Update the dictionary row with the storage path
  const { error: dbError } = await supabase
    .from('global_safety_dictionary')
    .update({ default_image_url: path, updated_at: new Date().toISOString() })
    .eq('topic_key', topicKey)
    .eq('language_code', languageCode || 'en')

  if (dbError) {
    console.error('[uploadSafetyImage db]', dbError)
    return { error: dbError.message }
  }

  revalidatePath('/admin/safety')
  return { success: true, path }
}

/**
 * Upload audio for a safety topic + language.
 */
export async function uploadSafetyAudio(formData: FormData) {
  const { operator } = await requireAdmin('admin')
  const supabase = createServiceClient()

  const topicKey = formData.get('topic_key') as string
  const languageCode = formData.get('language_code') as string
  const file = formData.get('file') as File

  if (!topicKey || !languageCode || !file || file.size === 0) {
    return { error: 'Topic key, language, and audio file are required' }
  }

  const ext = file.name.split('.').pop() ?? 'mp3'
  const path = `audio/${topicKey}_${languageCode}_${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('safety-assets')
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('[uploadSafetyAudio]', uploadError)
    return { error: uploadError.message }
  }

  // Create signed URL (private bucket)
  const { data: signedData } = await supabase.storage
    .from('safety-assets')
    .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

  const audioUrl = signedData?.signedUrl ?? path

  const { error: dbError } = await supabase
    .from('global_safety_dictionary')
    .update({ audio_url: audioUrl, updated_at: new Date().toISOString() })
    .eq('topic_key', topicKey)
    .eq('language_code', languageCode)

  if (dbError) {
    console.error('[uploadSafetyAudio db]', dbError)
    return { error: dbError.message }
  }

  revalidatePath('/admin/safety')
  return { success: true, path }
}

/**
 * Add a new topic to the dictionary (English).
 */
export async function addNewTopic(formData: FormData) {
  const { operator } = await requireAdmin('admin')
  const supabase = createServiceClient()

  const topicKey = (formData.get('topic_key') as string)?.trim().toLowerCase().replace(/\s+/g, '_')
  const title = formData.get('title') as string
  const instructions = formData.get('instructions') as string

  if (!topicKey || !title || !instructions) {
    return { error: 'Topic key, title, and instructions are required' }
  }

  const { error } = await supabase
    .from('global_safety_dictionary')
    .insert({
      topic_key: topicKey,
      language_code: 'en',
      title,
      instructions,
    })

  if (error) {
    if (error.code === '23505') return { error: 'Topic already exists' }
    console.error('[addNewTopic]', error)
    return { error: error.message }
  }

  revalidatePath('/admin/safety')
  return { success: true }
}

/**
 * Delete a dictionary row.
 */
export async function deleteDictionaryRow(topicKey: string, languageCode: string) {
  await requireAdmin('founder')
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('global_safety_dictionary')
    .delete()
    .eq('topic_key', topicKey)
    .eq('language_code', languageCode)

  if (error) {
    console.error('[deleteDictionaryRow]', error)
    return { error: error.message }
  }

  revalidatePath('/admin/safety')
  return { success: true }
}
