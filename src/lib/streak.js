import { supabase } from './supabase'

export async function getTodaySession(userId) {
  const today = new Date().toLocaleDateString('en-CA')

  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (error) return { minutes_studied: 0, streak_counted: false }
  if (data) return data

  const { data: newSession, error: insertError } = await supabase
    .from('study_sessions')
    .insert({ user_id: userId, date: today, minutes_studied: 0, streak_counted: false })
    .select()
    .maybeSingle()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: existing } = await supabase
        .from('study_sessions').select('*')
        .eq('user_id', userId).eq('date', today).maybeSingle()
      return existing || { minutes_studied: 0, streak_counted: false }
    }
    return { minutes_studied: 0, streak_counted: false }
  }

  return newSession || { minutes_studied: 0, streak_counted: false }
}

export async function addStudyMinute(userId) {
  const today = new Date().toLocaleDateString('en-CA')
  const { error } = await supabase.rpc('increment_study_minutes', {
    p_user_id: userId,
    p_date: today
  })
  if (error) throw error
}

export async function getStreakStats(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('streak_current, streak_longest, streak_last_date')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}