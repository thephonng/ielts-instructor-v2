import { supabase } from './supabase'

// Lấy danh sách bài nghe (published)
export async function getAllListeningPassages() {
  const { data, error } = await supabase
    .from('listening_passages')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Lấy một bài nghe đầy đủ kèm câu hỏi
export async function getListeningPassage(id) {
  const { data: passage, error } = await supabase
    .from('listening_passages')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error

  const questions = (passage.questions || []).map(q => ({
    ...q,
    question_type: q.question_type || passage.question_type,
  }))

  return { ...passage, questions }
}

// Lấy bài nghe theo loại câu hỏi
export async function getListeningPassagesByType(questionType) {
  const { data, error } = await supabase
    .from('listening_passages')
    .select('*')
    .eq('status', 'published')
    .eq('question_type', questionType)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// === ADMIN ===

export async function getAllListeningPassagesAdmin() {
  const { data, error } = await supabase
    .from('listening_passages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createListeningPassage(passageData, questions = []) {
  const { data: passage, error } = await supabase
    .from('listening_passages')
    .insert(passageData)
    .select()
    .single()
  if (error) throw error

  if (questions.length > 0) {
    const questionsWithId = questions.map((q, i) => ({
      ...q, passage_id: passage.id, passage_type: 'listening', order_index: i
    }))
    const { error: qError } = await supabase.from('passage_questions').insert(questionsWithId)
    if (qError) throw qError
  }
  return passage
}

export async function updateListeningPassage(id, passageData, questions) {
  const { error } = await supabase.from('listening_passages').update(passageData).eq('id', id)
  if (error) throw error

  if (questions !== undefined) {
    await supabase.from('passage_questions').delete().eq('passage_id', id).eq('passage_type', 'listening')
    if (questions.length > 0) {
      const questionsWithId = questions.map((q, i) => ({
        ...q, passage_id: id, passage_type: 'listening', order_index: i
      }))
      const { error: qError } = await supabase.from('passage_questions').insert(questionsWithId)
      if (qError) throw qError
    }
  }
}

export async function deleteListeningPassage(id) {
  await supabase.from('passage_questions').delete().eq('passage_id', id).eq('passage_type', 'listening')
  const { error } = await supabase.from('listening_passages').delete().eq('id', id)
  if (error) throw error
}