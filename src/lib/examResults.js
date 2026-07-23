import { supabase } from './supabase';

export function bandFromScore(score) {
  if (score <= 12)  return 4.0;
  if (score <= 14) return 5.0;
  if (score <= 16) return 5.5;
  if (score <= 24) return 6.0;
  if (score <= 26) return 6.5;
  if (score <= 28) return 7.0;
  if (score <= 32) return 7.5;
  if (score <= 34) return 8.0;
  if (score <= 36) return 8.5;
  return 9.0;
}

export async function saveExamResult({ userId, listeningScore, readingScore, totalScore, estimatedBand }) {
  const { data, error } = await supabase
    .from('exam_results')
    .insert({
      user_id: userId,
      listening_score: listeningScore,
      reading_score: readingScore,
      total_score: totalScore,
      estimated_band: estimatedBand
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getLatestExamResult(userId) {
  const { data, error } = await supabase
    .from('exam_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code === 'PGRST116') return null; // no rows
  if (error) throw error;
  return data;
}

export async function getUserExamResults(userId) {
  const { data, error } = await supabase
    .from('exam_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data;
}
