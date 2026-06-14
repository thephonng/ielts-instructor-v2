import { supabase } from './supabase'

// Lấy danh sách đề writing
export async function getWritingPrompts(task = null) {
  let query = supabase
    .from('writing_prompts')
    .select('id, title, task, type, prompt_en, prompt_vi, status')
    .eq('status', 'published')

  if (task) query = query.eq('task', task)

  const { data, error } = await query
  if (error) throw error
  return data
}

// Lấy một đề writing đầy đủ (kèm bài mẫu)
export async function getWritingPrompt(id) {
  const { data, error } = await supabase
    .from('writing_prompts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Lưu bài writing đã chấm
export async function saveWritingSubmission({
  userId, promptId, essay,
  bandOverall, bandTa, bandCc, bandLr, bandGra,
  feedback, mistakes
}) {
  const { data, error } = await supabase
    .from('writing_submissions')
    .insert({
      user_id: userId,
      prompt_id: promptId || null,
      essay,
      band_overall: bandOverall,
      band_ta: bandTa,
      band_cc: bandCc,
      band_lr: bandLr,
      band_gra: bandGra,
      feedback,
      mistakes
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Lấy lịch sử bài writing của user
export async function getWritingHistory(userId) {
  const { data, error } = await supabase
    .from('writing_submissions')
    .select('*, writing_prompts(title, task, type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

// Lấy tiến độ band writing theo thời gian
export async function getWritingProgress(userId) {
  const { data, error } = await supabase
    .from('writing_submissions')
    .select('band_overall, band_ta, band_cc, band_lr, band_gra, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(20)
  if (error) throw error
  return data
}

// Parse AI grading response into structured object
function parseGradingResponse(raw) {
  const result = {
    raw,
    overall: null, ta: null, cc: null, lr: null, gra: null,
    strengths: '', taskResponse: '', coherence: '', lexical: '', grammar: ''
  }

  // Match "Điểm tổng thể: 6.5" or "Điểm tổng thể:** 6.5"
  const overallMatch = raw.match(/Điểm tổng thể[*:\s]+(\d+\.?\d*)/i)
  const taMatch = raw.match(/Task\s*(Achievement|Response)\s*:\s*(\d+\.?\d*)/i)
  const ccMatch = raw.match(/Coherence and Cohesion\s*:\s*(\d+\.?\d*)/i)
  const lrMatch = raw.match(/Lexical Resource\s*:\s*(\d+\.?\d*)/i)
  const graMatch = raw.match(/Grammatical Range and Accuracy\s*:\s*(\d+\.?\d*)/i)

  if (overallMatch) result.overall = parseFloat(overallMatch[1])
  if (taMatch) result.ta = parseFloat(taMatch[2])
  if (ccMatch) result.cc = parseFloat(ccMatch[1])
  if (lrMatch) result.lr = parseFloat(lrMatch[1])
  if (graMatch) result.gra = parseFloat(graMatch[1])

  // Extract text sections
  const strengthsMatch = raw.match(/Điểm mạnh[*:\s]*([\s\S]*?)(?=Phân tích chi tiết|Task\s*(Achievement|Response)|$)/i)
  const taskMatch = raw.match(/Task\s*(Achievement|Response)\s*:\s*([\s\S]*?)(?=Coherence|$)/i)
  const cohMatch = raw.match(/Coherence and Cohesion\s*:\s*([\s\S]*?)(?=Lexical|$)/i)
  const lexMatch = raw.match(/Lexical Resource\s*:\s*([\s\S]*?)(?=Grammatical|$)/i)
  const gramMatch = raw.match(/Grammatical Range and Accuracy\s*:\s*([\s\S]*?)(?=KẾT QUẢ|Điểm thành phần|---|\*\*Điểm|$)/i)

  if (strengthsMatch) result.strengths = strengthsMatch[1].trim()
  if (taskMatch) result.taskResponse = taskMatch[2].trim()
  if (cohMatch) result.coherence = cohMatch[1].trim()
  if (lexMatch) result.lexical = lexMatch[1].trim()
  if (gramMatch) result.grammar = gramMatch[1].trim()

  return result
}

// Gọi Claude chấm bài, trả về parsed object
export async function gradeEssay(essay, prompt, task = 'task2', imageUrl = null) {
  const response = await fetch(
    'https://hmswyoewucijsxmaccvq.supabase.co/functions/v1/grade-essay',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essay, prompt, task, imageUrl })
    }
  )
  const data = await response.json()
  if (data.error) throw new Error(data.error)
  const raw = data.raw
  return parseGradingResponse(raw)
}

// === ADMIN ===
export async function createWritingPrompt(promptData) {
  const { data, error } = await supabase
    .from('writing_prompts')
    .insert(promptData)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWritingPrompt(id, updates) {
  const { data, error } = await supabase
    .from('writing_prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWritingPrompt(id) {
  const { error } = await supabase.from('writing_prompts').delete().eq('id', id)
  if (error) throw error
}

export async function getAllWritingPromptsAdmin() {
  const { data, error } = await supabase
    .from('writing_prompts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAllSubmissionsAdmin() {
  const { data, error } = await supabase
    .from('writing_submissions')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}
export async function checkAndIncrementGradingLimit(userId, limitPerDay = 10) {
  const today = new Date().toISOString().split('T')[0]

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('grading_date, grading_count')
    .eq('id', userId)
    .single()

  if (error) throw error

  const isNewDay = profile?.grading_date !== today
  const currentCount = isNewDay ? 0 : (profile?.grading_count || 0)

  if (currentCount >= limitPerDay) {
    throw new Error('LIMIT_REACHED')
  }

  await supabase.from('profiles').update({
    grading_date: today,
    grading_count: currentCount + 1
  }).eq('id', userId)
}