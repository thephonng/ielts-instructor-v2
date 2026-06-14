import { supabase } from './supabase'

export async function getPassageImages(passageId) {
  const { data, error } = await supabase
    .from('passage_images')
    .select('*')
    .eq('passage_id', passageId)
    .order('order_index')
  if (error) throw error
  return data || []
}

export async function savePassageImages(passageId, passageType, images) {
  // Delete old ones first
  await supabase.from('passage_images').delete().eq('passage_id', passageId)
  if (!images.length) return
  const { error } = await supabase.from('passage_images').insert(
    images.map((img, i) => ({
      passage_id: passageId,
      passage_type: passageType,
      image_url: img.url,
      caption: img.caption || null,
      order_index: i + 1,
    }))
  )
  if (error) throw error
}