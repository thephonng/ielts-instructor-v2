import { supabase } from './supabase'

export async function getPassages(topic = null) {
  let query = supabase
    .from('passages')
    .select('id, title, topic, status, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (topic) query = query.eq('topic', topic)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getPassage(id) {
  const { data, error } = await supabase
    .from('passages')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function saveReadingResult({ userId, passageId, mode, score, total }) {
  const accuracy = Math.round((score / total) * 100 * 100) / 100
  const { data, error } = await supabase
    .from('reading_results')
    .insert({ user_id: userId, passage_id: passageId, mode, score, total, accuracy })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getReadingHistory(userId) {
  const { data, error } = await supabase
    .from('reading_results')
    .select('*, passages(title, topic)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

export async function getTopicProgress(userId) {
  const { data, error } = await supabase
    .from('reading_results')
    .select('accuracy, passages(topic)')
    .eq('user_id', userId)
  if (error) throw error

  const topics = {}
  data.forEach(r => {
    const t = r.passages?.topic
    if (!t) return
    if (!topics[t]) topics[t] = { total: 0, sum: 0 }
    topics[t].total++
    topics[t].sum += r.accuracy
  })

  return Object.entries(topics).map(([topic, v]) => ({
    topic,
    count: v.total,
    avgAccuracy: Math.round(v.sum / v.total)
  }))
}

export async function createPassage(passageData) {
  const { data, error } = await supabase
    .from('passages')
    .insert(passageData)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePassage(id, updates) {
  const { data, error } = await supabase
    .from('passages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePassage(id) {
  const { error } = await supabase.from('passages').delete().eq('id', id)
  if (error) throw error
}

export async function getAllPassagesAdmin() {
  const { data, error } = await supabase
    .from('passages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ✅ FIXED: Questions are stored in passages.questions JSON column directly
export async function getPassageWithQuestions(id) {
  const { data: passage, error } = await supabase
    .from('passages')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error

  const questions = Array.isArray(passage.questions) ? passage.questions : []

  return { ...passage, questions }
}

export async function getPassagesByType(questionType) {
  const { data, error } = await supabase
    .from('passages')
    .select('*')
    .eq('status', 'published')
    .eq('question_type', questionType)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}