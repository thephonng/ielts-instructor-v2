import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { addStudyMinute, getTodaySession } from '../lib/streak';

export function useStreak(userId) {
  const [minutesToday, setMinutesToday] = useState(0);
  const [streakLit, setStreakLit]       = useState(false);
  const [streak, setStreak]             = useState(0);
  const [loading, setLoading]           = useState(true);
  const lastActivity = useRef(Date.now());
  const intervalRef  = useRef(null);
  const channelRef   = useRef(null);

  // Activity tracker
  useEffect(() => {
    if (!userId) return;
    const update = () => { lastActivity.current = Date.now(); };
    const evts = ['mousemove','keydown','click','scroll','touchstart'];
    evts.forEach(e => window.addEventListener(e, update));
    return () => evts.forEach(e => window.removeEventListener(e, update));
  }, [userId]);

  // Load + realtime + interval
  useEffect(() => {
    if (!userId) return;

    // Dọn sạch channel cũ trước khi tạo mới
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    let cancelled = false;

    async function loadData() {
      const [sessionRes, profileRes] = await Promise.allSettled([
        getTodaySession(userId),
        supabase.from('profiles').select('streak_current').eq('id', userId).maybeSingle(),
      ]);
      if (cancelled) return;
      const session = sessionRes.status === 'fulfilled' ? sessionRes.value : null;
      const profile = profileRes.status === 'fulfilled' ? profileRes.value?.data : null;
      setMinutesToday(session?.minutes_studied || 0);
      setStreakLit(session?.streak_counted || false);
      setStreak(profile?.streak_current || 0);
      setLoading(false);
    }

    loadData();

    // Defer việc tạo & subscribe channel sang tick kế tiếp để tránh
    // race condition với React StrictMode (mount -> cleanup -> mount lại)
    const timer = setTimeout(() => {
      if (cancelled) return;

      const channel = supabase.channel(`profile-streak-${userId}-${Date.now()}`);
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.new?.streak_current !== undefined) setStreak(payload.new.streak_current);
        }
      );
      channel.subscribe();
      channelRef.current = channel;
    }, 0);

    intervalRef.current = setInterval(async () => {
      if ((Date.now() - lastActivity.current) / 1000 < 90) {
        try {
          await addStudyMinute(userId);
          setMinutesToday(m => {
            const next = m + 1;
            if (next >= 30) setStreakLit(true);
            return next;
          });
        } catch (e) {
          console.error('Add minute error:', e);
        }
      }
    }, 60_000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  return {
    minutesToday, streakLit, streak, loading,
    progress:    Math.min((minutesToday / 30) * 100, 100),
    minutesLeft: Math.max(30 - minutesToday, 0),
  };
}