import { supabase } from './supabase';

// Save one attempt (always insert — keeps full history)
export async function saveExerciseResult({ userId, exerciseId, skill, questionType, score, total, band }) {
  const { data, error } = await supabase
    .from('user_exercise_results')
    .insert({
      user_id: userId,
      exercise_id: exerciseId,
      skill,
      question_type: questionType || null,
      score: score ?? null,
      total: total ?? null,
      band: band ?? null,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Get the best (highest band) result per exercise for a user
export async function getUserBestResults(userId) {
  const { data, error } = await supabase
    .from('user_exercise_results')
    .select('exercise_id, skill, band, completed_at, question_type')
    .eq('user_id', userId)
    .order('band', { ascending: false });
  if (error) throw error;

  // Deduplicate — keep best band per exercise_id
  const best = {};
  for (const row of data) {
    if (!best[row.exercise_id] || row.band > best[row.exercise_id].band) {
      best[row.exercise_id] = row;
    }
  }
  return Object.values(best);
}

// Returns { [exerciseId]: { band, skill, completedAt } } for fast catalog lookup
export async function getUserBestResultMap(userId) {
  const results = await getUserBestResults(userId);
  const map = {};
  for (const r of results) {
    map[r.exercise_id] = { band: r.band, skill: r.skill, completedAt: r.completed_at };
  }
  return map;
}
export async function getExerciseCountBySkill(userId) {
  const { data, error } = await supabase
    .from('user_exercise_results')
    .select('exercise_id, skill')
    .eq('user_id', userId);
  if (error) throw error;

  const seen = new Set();
  const counts = { reading: 0, listening: 0, writing: 0 };
  for (const row of data) {
    if (!seen.has(row.exercise_id)) {
      seen.add(row.exercise_id);
      if (row.skill in counts) counts[row.skill]++;
    }
  }
  return counts;
}