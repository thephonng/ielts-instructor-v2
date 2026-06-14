import { supabase } from './supabase'

const TABLE = 'entrance_exam_questions'

export async function getAllExamQuestions() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

export async function getExamQuestionsOrdered() {
  return getAllExamQuestions()
}

export async function createExamQuestion(data) {
  const { data: created, error } = await supabase
    .from(TABLE)
    .insert([data])
    .select()
    .single()

  if (error) throw error
  return created
}

export async function updateExamQuestion(id, data) {
  const { data: updated, error } = await supabase
    .from(TABLE)
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated
}

export async function deleteExamQuestion(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}