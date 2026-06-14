import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBestResultMap, saveExerciseResult } from '../lib/exerciseResults';
import { getPassagesByType, getPassageWithQuestions } from '../lib/passages';
import { getListeningPassagesByType, getListeningPassage } from '../lib/listening';
import { gradeEssay, saveWritingSubmission, getWritingPrompts, checkAndIncrementGradingLimit } from '../lib/writing';
import { bandFromScore } from '../lib/examResults';
import { supabase } from '../lib/supabase';
import { getPassageImages } from '../lib/passageImages';

// ─── Theme ───────────────────────────────────────────────────────────────────
const R = '#B91C1C';
const R2 = '#DC2626';
const R3 = '#EF4444';
const RD = '#7F1D1D';
const RL = '#FEF2F2';
const RM = '#FCA5A5';
const GRAY = '#6B7280';

// ─── Question Type Config ─────────────────────────────────────────────────────
const READING_TYPES = [
  { value: 'true_false',        label: 'True / False / Not Given', icon: TFIcon },
  { value: 'yes_no',            label: 'Yes / No / Not Given',     icon: YNIcon },
  { value: 'matching_headings', label: 'Matching Headings',        icon: MHIcon },
  { value: 'matching_info',     label: 'Matching Information',     icon: MIIcon },
  { value: 'matching_features', label: 'Matching Features',        icon: MFIcon },
  { value: 'mcq_single',        label: 'MCQ — Single Answer',      icon: MCQSIcon },
  { value: 'mcq_multi',         label: 'MCQ — Multiple Answers',   icon: MCQMIcon },
  { value: 'gap_filling',       label: 'Gap Filling',              icon: GFIcon },
];

const LISTENING_TYPES = [
  { value: 'gap_filling',       label: 'Gap Filling',              icon: GFIcon },
  { value: 'map_diagram_label', label: 'Map / Diagram Label',      icon: DLIcon },
  { value: 'mcq_single',       label: 'MCQ — Single Answer',       icon: MCQSIcon },
  { value: 'mcq_multi',        label: 'MCQ — Multiple Answers',    icon: MCQMIcon },
  { value: 'matching',         label: 'Matching',                  icon: MFIcon },
];

const WRITING_TYPES = [
  { value: 'task1', label: 'Task 1', icon: W1Icon },
  { value: 'task2', label: 'Task 2', icon: W2Icon },
];

const GRADING_STEPS = [
  'Đang đọc bài viết của bạn...',
  'Phân tích Task Response...',
  'Kiểm tra Coherence & Cohesion...',
  'Đánh giá Lexical Resource...',
  'Phân tích Grammar...',
  'Tính điểm tổng...',
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function TFIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="3" y="6" width="22" height="4" rx="2" fill={color} opacity=".15"/>
      <rect x="3" y="12" width="22" height="4" rx="2" fill={color} opacity=".15"/>
      <rect x="3" y="18" width="22" height="4" rx="2" fill={color} opacity=".15"/>
      <circle cx="7" cy="8" r="2.5" fill={color}/>
      <circle cx="7" cy="14" r="2.5" fill={color} opacity=".5"/>
      <circle cx="7" cy="20" r="2.5" fill={color} opacity=".3"/>
      <path d="M11 8h10M11 14h7M11 20h9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function YNIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke={color} strokeWidth="2" opacity=".2"/>
      <path d="M9 14l3.5 3.5L19 10" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 4v2M14 22v2M4 14h2M22 14h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  );
}
function MHIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="2" y="4" width="10" height="3" rx="1.5" fill={color}/>
      <rect x="2" y="9" width="10" height="3" rx="1.5" fill={color} opacity=".6"/>
      <rect x="2" y="14" width="10" height="3" rx="1.5" fill={color} opacity=".4"/>
      <rect x="2" y="19" width="10" height="3" rx="1.5" fill={color} opacity=".25"/>
      <path d="M15 5.5h11M15 10.5h8M15 15.5h10M15 20.5h7" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity=".5"/>
      <path d="M13 5.5l-1 5M13 10.5l-1 5" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity=".3"/>
    </svg>
  );
}
function MIIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="2" y="5" width="10" height="18" rx="2" stroke={color} strokeWidth="1.8" opacity=".3"/>
      <rect x="16" y="5" width="10" height="18" rx="2" stroke={color} strokeWidth="1.8" opacity=".3"/>
      <path d="M12 10h4M12 14h4M12 18h4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="7" cy="10" r="1.5" fill={color}/>
      <circle cx="7" cy="14" r="1.5" fill={color} opacity=".6"/>
      <circle cx="21" cy="14" r="1.5" fill={color}/>
      <circle cx="21" cy="10" r="1.5" fill={color} opacity=".6"/>
    </svg>
  );
}
function MFIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="7" cy="9" r="3" stroke={color} strokeWidth="1.8"/>
      <circle cx="7" cy="19" r="3" stroke={color} strokeWidth="1.8" opacity=".5"/>
      <circle cx="21" cy="9" r="3" fill={color}/>
      <circle cx="21" cy="19" r="3" fill={color} opacity=".5"/>
      <path d="M10 9h8M10 19h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
      <path d="M10 9C14 9 14 19 18 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  );
}
function MCQSIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke={color} strokeWidth="2" opacity=".2"/>
      <circle cx="14" cy="14" r="5" fill={color}/>
      <circle cx="14" cy="14" r="7.5" stroke={color} strokeWidth="1.5" opacity=".5"/>
    </svg>
  );
}
function MCQMIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="4" y="7" width="6" height="6" rx="1.5" fill={color}/>
      <rect x="4" y="15" width="6" height="6" rx="1.5" fill={color} opacity=".4"/>
      <rect x="14" y="7" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" opacity=".4"/>
      <rect x="14" y="15" width="6" height="6" rx="1.5" fill={color} opacity=".7"/>
      <path d="M5.5 10l1.5 1.5L10 8M15.5 18l1.5 1.5L20 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function GFIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="2" y="8" width="24" height="3" rx="1.5" fill={color} opacity=".15"/>
      <rect x="2" y="13" width="24" height="3" rx="1.5" fill={color} opacity=".15"/>
      <rect x="2" y="18" width="16" height="3" rx="1.5" fill={color} opacity=".15"/>
      <rect x="7" y="11.5" width="6" height="2" rx="1" fill={color}/>
      <rect x="16" y="16.5" width="5" height="2" rx="1" fill={color} opacity=".6"/>
      <path d="M10 7l-1.5-3h3L10 7z" fill={color} opacity=".4"/>
    </svg>
  );
}
function DLIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="3" y="3" width="22" height="16" rx="2" stroke={color} strokeWidth="1.8" opacity=".3"/>
      <circle cx="10" cy="11" r="3" stroke={color} strokeWidth="1.5"/>
      <path d="M16 8h5M16 11h5M16 14h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
      <path d="M10 21v4M7 25h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
      <circle cx="10" cy="11" r="1" fill={color}/>
    </svg>
  );
}
function MLIcon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="3" y="4" width="22" height="20" rx="2" stroke={color} strokeWidth="1.8" opacity=".25"/>
      <path d="M3 10h22M10 4v20" stroke={color} strokeWidth="1.2" opacity=".2"/>
      <path d="M14 12l2 4-2 4-2-4 2-4z" fill={color}/>
      <circle cx="14" cy="12" r="2" fill={color} opacity=".8"/>
      <path d="M19 8l1.5 3-1.5 3-1.5-3 1.5-3z" fill={color} opacity=".5"/>
    </svg>
  );
}
function W1Icon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="3" y="3" width="16" height="22" rx="2" stroke={color} strokeWidth="1.8" opacity=".3"/>
      <path d="M7 8h8M7 12h8M7 16h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
      <path d="M18 16l6-6-2-2-6 6v2h2z" fill={color}/>
    </svg>
  );
}
function W2Icon({ size = 28, color = R }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="2" y="4" width="24" height="20" rx="2" stroke={color} strokeWidth="1.8" opacity=".25"/>
      <path d="M6 9h16M6 13h16M6 17h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
      <circle cx="21" cy="17" r="4" fill={color}/>
      <path d="M19.5 17l1 1 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const formatTime = (s) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

// ─── Audio Player ─────────────────────────────────────────────────────────────
function AudioPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const togglePlay = () => {
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const skip = (sec) => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + sec);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: 16, padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={e => {
          setElapsed(e.target.currentTime);
          setProgress(e.target.duration ? (e.target.currentTime / e.target.duration) * 100 : 0);
        }}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />
      <button onClick={() => skip(-10)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 4 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.67"/>
          <text x="9" y="16" fontSize="7" fill="white" stroke="none">10</text>
        </svg>
      </button>
      <button onClick={togglePlay} style={{
        width: 48, height: 48, borderRadius: '50%',
        background: `linear-gradient(135deg, ${R2} 0%, ${RD} 100%)`,
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 16px rgba(185,28,28,0.5)`, flexShrink: 0
      }}>
        {playing
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
        }
      </button>
      <button onClick={() => skip(10)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 4 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-3.67"/>
          <text x="9" y="16" fontSize="7" fill="white" stroke="none">10</text>
        </svg>
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, cursor: 'pointer', position: 'relative' }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) audioRef.current.currentTime = pct * duration;
          }}
        >
          <div style={{
            width: `${progress}%`, height: '100%',
            background: `linear-gradient(90deg, ${R3} 0%, ${R2} 100%)`,
            borderRadius: 99, transition: 'width 0.1s linear', position: 'relative'
          }}>
            <div style={{
              position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
              width: 12, height: 12, borderRadius: '50%', background: '#fff',
              boxShadow: `0 0 8px ${R2}`
            }}/>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          <span>{formatTime(Math.floor(elapsed))}</span>
          <span>{formatTime(Math.floor(duration))}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, skill, completed, isPremiumUser, onStart, onLocked, typeConfig }) {
  const [hov, setHov] = useState(false);
  const isCompleted = !!completed;
  const isLocked = exercise.is_pro && !isPremiumUser;
  const IconComp = typeConfig?.icon || GFIcon;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onStart(exercise)}
      style={{
        background: '#fff',
        border: `2px solid ${isCompleted ? '#22C55E33' : '#F0F0F0'}`,
        borderRadius: 20,
        padding: '22px 20px',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
        transform: hov && !isLocked ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hov && !isLocked
          ? '0 12px 32px rgba(0,0,0,0.10), 0 0 0 2px rgba(185,28,28,0.08)'
          : isCompleted ? '0 4px 16px rgba(34,197,94,0.1)' : '0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative', overflow: 'hidden',
        opacity: isLocked ? 0.7 : 1,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: isCompleted ? '#22C55E' : '#F0F0F0',
        transition: 'all 0.22s ease'
      }}/>

      {exercise.is_pro && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: '#fff', fontSize: 11, fontWeight: 800,
          padding: '4px 10px 4px 8px', borderRadius: 20,
          boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
          display: 'flex', alignItems: 'center', gap: 5
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M2 20h20v-2H2v2zm2-4h16l2-10-6 4-4-8-4 8-6-4 2 10z"/>
          </svg>
          PRO
        </div>
      )}

      <div style={{
        width: 56, height: 56, borderRadius: 16, marginBottom: 14,
        background: RL,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.22s ease',
      }}>
        <IconComp size={28} color={R} />
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: '#111', lineHeight: 1.4, marginBottom: 10, paddingRight: exercise.is_pro ? 40 : 0 }}>
        {typeConfig?.label ? `${typeConfig.label} - ${exercise.title}` : exercise.title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, color: '#6B7280' }}>
          {exercise.questions?.length || exercise.question_count || '?'} câu hỏi
        </span>
      </div>

      {isCompleted ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#DCFCE7', borderRadius: 12, padding: '8px 14px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>Bài đã hoàn thành</span>
          </div>
          <button style={{
            fontSize: 13, fontWeight: 700, color: '#6B7280',
            background: '#F9FAFB', border: '1.5px solid #E5E7EB',
            borderRadius: 10, padding: '8px 14px', cursor: 'pointer'
          }}>Làm lại</button>
        </div>
      ) : isLocked ? (
        <div style={{
          width: '100%', padding: '11px 16px',
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          borderRadius: 12, border: '1.5px solid #F59E0B22',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#D97706' }}>Nâng cấp PRO</span>
        </div>
      ) : (
        <div style={{
          width: '100%', padding: '12px 0', textAlign: 'center',
          background: RL,
          borderRadius: 12, fontSize: 14, fontWeight: 800,
          color: R, transition: 'all 0.22s ease',
        }}>Bắt đầu →</div>
      )}
    </div>
  );
}

// ─── Sidebar Type Item ────────────────────────────────────────────────────────
function TypeItem({ type, isActive, onClick, accuracy }) {
  const [hov, setHov] = useState(false);
  const IconComp = type.icon;
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 14, border: 'none',
        background: isActive ? `linear-gradient(135deg, ${RL} 0%, #fff 100%)` : hov ? '#FAFAFA' : 'transparent',
        cursor: 'pointer', textAlign: 'left',
        borderLeft: isActive ? `3px solid ${R}` : '3px solid transparent',
        transition: 'all 0.18s ease',
        transform: hov && !isActive ? 'translateX(2px)' : 'translateX(0)',
        boxShadow: isActive ? `0 2px 12px rgba(185,28,28,0.1)` : 'none'
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: isActive ? RL : hov ? RL : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s ease'
      }}>
        <IconComp size={22} color={isActive || hov ? R : '#9CA3AF'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: isActive ? 800 : 600, color: isActive ? R : '#374151', lineHeight: 1.3 }}>
          {type.label}
        </div>
        <div style={{ fontSize: 12, color: isActive ? '#EF4444' : '#9CA3AF', marginTop: 2, fontWeight: 600 }}>
          {accuracy != null ? `Bài đã hoàn thành: ${accuracy}%` : 'Bài đã hoàn thành:'}
        </div>
      </div>
      {isActive && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: R, flexShrink: 0 }}/>
      )}
    </button>
  );
}

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
function CustomDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const listHeight = Math.min(options.length * 48 + 16, 260);
      setDropUp(spaceBelow < listHeight);
    }
    setOpen(o => !o);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: `2px solid ${value ? R : '#E5E7EB'}`,
          borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: 600,
          background: value ? RL : '#fff', color: value ? R : '#9CA3AF',
          cursor: 'pointer', outline: 'none', transition: 'all 0.18s ease',
          boxShadow: open ? `0 0 0 3px rgba(185,28,28,0.1)` : 'none',
        }}
      >
        <span>{value || '— Chọn đáp án —'}</span>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={value ? R : '#9CA3AF'} strokeWidth="2.5"
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          [dropUp ? 'bottom' : 'top']: 'calc(100% + 6px)',
          left: 0, right: 0, zIndex: 999,
          background: '#fff',
          border: '1.5px solid #E5E7EB',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          maxHeight: 260,
          overflowY: 'auto',
          animation: 'dropIn 0.15s cubic-bezier(.4,0,.2,1)',
        }}>
          <style>{`
            @keyframes dropIn { from{opacity:0;transform:translateY(${dropUp ? '6px' : '-6px'})} to{opacity:1;transform:translateY(0)} }
            .dd-opt { padding: 12px 18px; font-size: 15px; font-weight: 500; cursor: pointer; transition: background 0.12s, color 0.12s, transform 0.12s; color: #374151; }
            .dd-opt:hover { background: #FEF2F2; color: #B91C1C; transform: translateX(4px); }
            .dd-opt-sel { background: #FEF2F2; color: #B91C1C; font-weight: 700; }
          `}</style>
          {options.map((opt, i) => (
            <div
              key={i}
              className={`dd-opt${value === opt ? ' dd-opt-sel' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {value === opt && <span style={{ marginRight: 8 }}>✓</span>}
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Question Item ────────────────────────────────────────────────────────────
function QuestionItem({ q, index, answers, setAnswers }) {
  const type = q.question_type;
  const options = (() => {
    try { return typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); }
    catch { return []; }
  })();
  const setAnswer = (val) => setAnswers(a => ({ ...a, [q.id]: val }));

  const btnBase = {
    border: '2px solid #E5E7EB', borderRadius: 14, padding: '14px 18px',
    cursor: 'pointer', fontSize: 15, fontWeight: 600, transition: 'all 0.18s ease',
    textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: 12,
  };

  if (type === 'true_false' || type === 'yes_no') {
    const opts = type === 'true_false' ? ['True', 'False', 'Not Given'] : ['Yes', 'No', 'Not Given'];
    return (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {opts.map(opt => {
          const sel = answers[q.id] === opt;
          return (
            <button key={opt} onClick={() => setAnswer(opt)} style={{
              padding: '12px 22px', borderRadius: 12, border: `2px solid ${sel ? R : '#E5E7EB'}`,
              background: sel ? `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` : '#fff',
              color: sel ? '#fff' : '#374151', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', transition: 'all 0.18s ease',
              boxShadow: sel ? `0 4px 14px rgba(185,28,28,0.35)` : 'none',
              transform: sel ? 'translateY(-1px)' : 'translateY(0)'
            }}>{opt}</button>
          );
        })}
      </div>
    );
  }

  if (type === 'mcq_single') {
    const opts = options.length > 0 ? options : ['A', 'B', 'C', 'D'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((opt, i) => {
          const label = typeof opt === 'string' && opt.match(/^[A-D]\./) ? opt[0] : String.fromCharCode(65 + i);
          const sel = answers[q.id] === label;
          return (
            <button key={i} onClick={() => setAnswer(label)} style={{
              ...btnBase,
              background: sel ? RL : '#fff',
              border: `2px solid ${sel ? R : '#E5E7EB'}`,
              color: '#374151',
              boxShadow: sel ? `0 2px 12px rgba(185,28,28,0.15)` : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: sel ? `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` : '#F3F4F6',
                color: sel ? '#fff' : '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, transition: 'all 0.18s ease'
              }}>{label}</div>
              <span style={{ fontWeight: sel ? 700 : 600, color: sel ? R : '#374151' }}>{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'mcq_multi') {
    const opts = options.length > 0 ? options : ['A', 'B', 'C', 'D'];
    const selected = answers[q.id] ? answers[q.id].split(',') : [];
    const toggle = (label) => {
      const next = selected.includes(label) ? selected.filter(x => x !== label) : [...selected, label];
      setAnswer(next.join(','));
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((opt, i) => {
          const label = typeof opt === 'string' && opt.match(/^[A-D]\./) ? opt[0] : String.fromCharCode(65 + i);
          const sel = selected.includes(label);
          return (
            <button key={i} onClick={() => toggle(label)} style={{
              ...btnBase,
              background: sel ? RL : '#fff',
              border: `2px solid ${sel ? R : '#E5E7EB'}`,
              boxShadow: sel ? `0 2px 12px rgba(185,28,28,0.15)` : 'none',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0, border: `2px solid ${sel ? R : '#D1D5DB'}`,
                background: sel ? `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s ease'
              }}>
                {sel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#6B7280', flexShrink: 0 }}>{label}</div>
              <span style={{ fontWeight: sel ? 700 : 600, color: sel ? R : '#374151' }}>{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'gap_filling') {
    return (
      <input
        type="text"
        value={answers[q.id] || ''}
        onChange={e => setAnswer(e.target.value)}
        placeholder="Nhập câu trả lời..."
        style={{
          width: '100%', border: `2px solid ${answers[q.id] ? R : '#E5E7EB'}`,
          borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: 600,
          outline: 'none', transition: 'all 0.18s ease',
          background: answers[q.id] ? RL : '#fff',
          boxShadow: answers[q.id] ? `0 2px 12px rgba(185,28,28,0.1)` : 'none'
        }}
        onFocus={e => { e.target.style.border = `2px solid ${R}`; e.target.style.boxShadow = `0 0 0 4px rgba(185,28,28,0.1)`; }}
        onBlur={e => { e.target.style.border = `2px solid ${answers[q.id] ? R : '#E5E7EB'}`; e.target.style.boxShadow = answers[q.id] ? `0 2px 12px rgba(185,28,28,0.1)` : 'none'; }}
      />
    );
  }

  if (['matching_headings', 'matching_info', 'matching_features', 'matching'].includes(type)) {
    return <CustomDropdown value={answers[q.id] || ''} onChange={setAnswer} options={options} />;
  }

  return (
    <input
      type="text"
      value={answers[q.id] || ''}
      onChange={e => setAnswer(e.target.value)}
      placeholder="Nhập câu trả lời..."
      style={{
        width: '100%', border: `2px solid #E5E7EB`, borderRadius: 12,
        padding: '14px 18px', fontSize: 15, fontWeight: 600, outline: 'none'
      }}
    />
  );
}

// ─── Resizable Panels ─────────────────────────────────────────────────────────
function ResizablePanels({ left, right }) {
  const [split, setSplit] = useState(55);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const onMouseDown = (e) => { e.preventDefault(); dragging.current = true; document.body.style.userSelect = 'none'; };
  const onMouseMove = (e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(75, Math.max(25, pct)));
  };
  const onMouseUp = () => { dragging.current = false; document.body.style.userSelect = ''; };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>
      <div style={{ width: `${split}%`, overflow: 'auto', padding: '24px 28px' }}>{left}</div>
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 6, background: '#F0F0F0', cursor: 'col-resize', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.18s', position: 'relative'
        }}
        onMouseEnter={e => e.currentTarget.style.background = RM}
        onMouseLeave={e => e.currentTarget.style.background = '#F0F0F0'}
      >
        <div style={{ width: 3, height: 40, background: '#D1D5DB', borderRadius: 99 }}/>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px' }}>{right}</div>
    </div>
  );
}

// ─── Result Views ─────────────────────────────────────────────────────────────
function ReadingListeningResult({ result, onBack }) {
  const [show, setShow] = useState(false);
  const correct = result.score;
  const total = result.total;
  const wrong = total - correct;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, #7F1D1D 0%, #B91C1C 50%, #EF4444 100%)`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Kết quả</span>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 560, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            {result.skill === 'listening' ? '🎧 Listening' : '📖 Reading'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#F0FDF4', border: '3px solid #22C55E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#16A34A', lineHeight: 1 }}>{correct}</span>
                <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>/{total}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Câu đúng</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#FFF5F5', border: '3px solid #EF4444', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: R, lineHeight: 1 }}>{wrong}</span>
                <span style={{ fontSize: 11, color: R, fontWeight: 600 }}>/{total}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: R }}>Câu sai</span>
            </div>
          </div>
          <div style={{ background: '#F3F4F6', borderRadius: 99, height: 10, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${Math.round((correct / total) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)', borderRadius: 99, transition: 'width 1s ease' }}/>
          </div>
          <div style={{ fontSize: 13, color: GRAY, fontWeight: 600 }}>{Math.round((correct / total) * 100)}% chính xác</div>
        </div>

        <div style={{ width: '100%', maxWidth: 560 }}>
          <button onClick={() => setShow(s => !s)} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: '2px solid rgba(255,255,255,0.4)',
            background: show ? '#fff' : 'rgba(255,255,255,0.15)',
            color: show ? R : '#fff',
            fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s',
            backdropFilter: 'blur(8px)'
          }}>
            {show ? '▲ Ẩn đáp án' : '▼ Xem đáp án & giải thích'}
          </button>

          {show && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {result.questions.map((q, i) => {
                const ua = (result.answers[q.id] || '').toString().trim().toLowerCase();
                const ca = (q.correct_answer || '').toString().trim().toLowerCase();
                const ok = ua === ca;
                return (
                  <div key={q.id} style={{ padding: '16px 18px', borderRadius: 16, background: ok ? '#F0FDF4' : '#FFF5F5', border: `1.5px solid ${ok ? '#BBF7D0' : '#FECACA'}` }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: ok ? '#22C55E' : R, color: '#fff', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.5 }}>{q.question_text}</span>
                    </div>
                    <div style={{ fontSize: 13, color: GRAY, paddingLeft: 38 }}>
                      Bạn trả lời: <span style={{ fontWeight: 700, color: ok ? '#16A34A' : R }}>{result.answers[q.id] || '(chưa trả lời)'}</span>
                    </div>
                    {!ok && <div style={{ fontSize: 13, color: '#16A34A', fontWeight: 700, marginTop: 4, paddingLeft: 38 }}>Đáp án đúng: {q.correct_answer}</div>}
                    {q.explanation && <div style={{ fontSize: 12, color: GRAY, marginTop: 8, fontStyle: 'italic', padding: '8px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 8, marginLeft: 38 }}>💡 {q.explanation}</div>}
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={onBack} style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: '#fff', color: R, fontWeight: 800, fontSize: 15, cursor: 'pointer',
            marginTop: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'opacity 0.15s'
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >← Quay lại</button>
        </div>
      </div>
    </div>
  );
}

function WritingResult({ result, onBack, onRetry }) {
  const [tab, setTab] = useState('essay');
  const { parsed, essay, prompt } = result;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '32px 16px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{
          background: `linear-gradient(135deg, ${RD} 0%, ${R} 60%, ${R3} 100%)`,
          borderRadius: 28, padding: '40px 32px', marginBottom: 24,
          boxShadow: `0 16px 48px rgba(185,28,28,0.4)`, color: '#fff'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Overall Band</div>
            <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1 }}>{parsed.overall ?? '–'}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>±0.5 band</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { label: 'Task Response', score: parsed.ta },
              { label: 'Coherence & Cohesion', score: parsed.cc },
              { label: 'Lexical Resource', score: parsed.lr },
              { label: 'Grammar', score: parsed.gra },
            ].map(({ label, score }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 16px', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{score ?? '–'}</div>
                <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 99, height: 4, marginTop: 8 }}>
                  <div style={{ width: score ? `${(score / 9) * 100}%` : 0, height: '100%', background: '#fff', borderRadius: 99 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', background: '#fff', borderRadius: 16, padding: 6, marginBottom: 20, gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[{ value: 'essay', label: '📝 Bài của bạn' }, { value: 'feedback', label: '📊 Nhận xét' }, { value: 'model', label: '⭐ Bài mẫu' }].map(t => (
            <button key={t.value} onClick={() => setTab(t.value)} style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: tab === t.value ? `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` : 'transparent',
              color: tab === t.value ? '#fff' : '#6B7280',
              fontWeight: tab === t.value ? 800 : 600, fontSize: 14,
              transition: 'all 0.18s ease',
              boxShadow: tab === t.value ? `0 4px 12px rgba(185,28,28,0.3)` : 'none'
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: '24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {tab === 'essay' && <div style={{ whiteSpace: 'pre-wrap', color: '#374151', fontSize: 15, lineHeight: 1.8 }}>{essay}</div>}
          {tab === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {parsed.strengths && (
                <div style={{ background: '#F0FDF4', border: '2px solid #BBF7D0', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 800, color: '#16A34A', marginBottom: 8, fontSize: 15 }}>💪 Điểm mạnh</div>
                  <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: (parsed.strengths || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}/>
                </div>
              )}
              {[
                { label: 'Task Response', score: parsed.ta, text: parsed.taskResponse },
                { label: 'Coherence & Cohesion', score: parsed.cc, text: parsed.coherence },
                { label: 'Lexical Resource', score: parsed.lr, text: parsed.lexical },
                { label: 'Grammar', score: parsed.gra, text: parsed.grammar },
              ].map(({ label, score, text }) => (
                <div key={label} style={{ border: '2px solid #F0F0F0', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{label}</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: R }}>{score ?? '–'}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: (text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}/>
                </div>
              ))}
            </div>
          )}
          {tab === 'model' && (
            prompt.sample_essay
              ? <div style={{ whiteSpace: 'pre-wrap', color: '#374151', fontSize: 15, lineHeight: 1.8 }}>{prompt.sample_essay}</div>
              : <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0', fontSize: 15 }}>📭 Chưa có bài mẫu cho đề này</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onBack} style={{
            flex: 1, padding: '16px 0', borderRadius: 16, border: `2px solid #E5E7EB`,
            background: '#fff', color: '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer'
          }}>← Quay lại</button>
          <button onClick={onRetry} style={{
            flex: 1, padding: '16px 0', borderRadius: 16, border: 'none',
            background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)`,
            color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            boxShadow: `0 6px 20px rgba(185,28,28,0.35)`
          }}>🔄 Viết lại</button>
        </div>
      </div>
    </div>
  );
}

// ─── Grading Screen ───────────────────────────────────────────────────────────
function GradingScreen({ step }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #7F1D1D 0%, #B91C1C 50%, #EF4444 100%)',
      flexDirection: 'column', gap: 20, padding: 16
    }}>
      <img src="/ielts-logo.png" alt="IELTS Instructor"
        style={{ height: 56, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 }}>
        {GRADING_STEPS[step]}
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.7)',
            animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TestPractice({ user, profile }) {
  const isPremium = profile?.plan === 'premium';
  const navigate = useNavigate();

  const [view, setView] = useState('catalog');
  const [activeSkill, setActiveSkill] = useState('reading');
  const [activeType, setActiveType] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [result, setResult] = useState(null);
  const [completedMap, setCompletedMap] = useState({});
  const [exercises, setExercises] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [essay, setEssay] = useState('');
  const [gradingStep, setGradingStep] = useState(0);
  const [filterPro, setFilterPro] = useState('all');
  const [passageImages, setPassageImages] = useState([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserBestResultMap(user.id).then(setCompletedMap).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (view !== 'catalog') return;
    const types = activeSkill === 'reading' ? READING_TYPES : activeSkill === 'listening' ? LISTENING_TYPES : WRITING_TYPES;
    const type = activeType || types[0].value;
    setCatalogLoading(true);
    setExercises([]);
    const load = async () => {
      try {
        let data = [];
        if (activeSkill === 'reading') data = await getPassagesByType(type);
        else if (activeSkill === 'listening') data = await getListeningPassagesByType(type);
        else {
          const { data: prompts, error } = await supabase.from('writing_prompts').select('*').eq('status', 'published').eq('task', type);
          if (error) throw error;
          data = prompts || [];
        }
        const sorted = [...data].sort((a, b) => {
          if (a.is_pro !== b.is_pro) return a.is_pro ? 1 : -1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setExercises(sorted);
      } catch (err) { console.error(err); }
      finally { setCatalogLoading(false); }
    };
    load();
  }, [view, activeSkill, activeType]);

  useEffect(() => {
    if ((view !== 'reading' && view !== 'listening') || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timer); handleExerciseSubmit(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, submitted]);

  useEffect(() => {
    if (view !== 'writing') return;
    const timer = setInterval(() => { setTimeLeft(t => t <= 1 ? 0 : t - 1); }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  useEffect(() => {
    if (view !== 'grading') return;
    const interval = setInterval(() => { setGradingStep(s => Math.min(s + 1, GRADING_STEPS.length - 1)); }, 1500);
    return () => clearInterval(interval);
  }, [view]);

  const handleStart = (exercise) => {
    if (activeSkill !== 'writing' && exercise.is_pro && !isPremium) {
      setShowProModal(true);
      return;
    }
    navigate(`/exercise/${exercise.id}?skill=${activeSkill}`);
  };

  const handleExerciseSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    const questions = currentExercise.questions || [];
    let correct = 0;
    questions.forEach(q => {
      if ((answers[q.id] || '').toString().trim().toLowerCase() === (q.correct_answer || '').toString().trim().toLowerCase()) correct++;
    });
    const total = questions.length;
    const band = bandFromScore(correct);
    const skill = view;
    try {
      await saveExerciseResult({ userId: user.id, exerciseId: currentExercise.id, skill, questionType: currentExercise.question_type, score: correct, total, band });
      setCompletedMap(m => ({ ...m, [currentExercise.id]: { band, skill } }));
    } catch (err) { console.error(err); }
    setResult({ skill, band, score: correct, total, questions, answers: { ...answers } });
    setShowSubmitSuccess(true);
  };

  const handleWritingSubmit = async () => {
    const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
    const isTask1 = currentExercise?.task === 'task1';
    const maxWords = currentExercise?.rec_words || (isTask1 ? 380 : 490);
    if (wordCount < 50) { alert('Bài viết quá ngắn (tối thiểu 50 từ).'); return; }
    if (wordCount > maxWords) { alert(`Bài viết quá dài (tối đa ${maxWords} từ).`); return; }
    try {
      await checkAndIncrementGradingLimit(user.id, 10);
    } catch (e) {
      if (e.message === 'LIMIT_REACHED') {
        alert('Bạn đã dùng hết 10 lượt chấm bài hôm nay. Quay lại vào ngày mai nhé! 🙏');
        return;
      }
    }
    if (!isPremium) {
      setShowProModal(true)
      return
    }
    setGradingStep(0); setView('grading');
    try {
      const parsed = await gradeEssay(essay, currentExercise.prompt_en, currentExercise.task);
      await saveWritingSubmission({ userId: user.id, promptId: currentExercise.id, essay, bandOverall: parsed.overall, bandTa: parsed.ta, bandCc: parsed.cc, bandLr: parsed.lr, bandGra: parsed.gra, feedback: { strengths: parsed.strengths, taskResponse: parsed.taskResponse, coherence: parsed.coherence, lexical: parsed.lexical, grammar: parsed.grammar }, mistakes: null });
      await saveExerciseResult({ userId: user.id, exerciseId: currentExercise.id, skill: 'writing', questionType: currentExercise.task, score: null, total: null, band: parsed.overall });
      setCompletedMap(m => ({ ...m, [currentExercise.id]: { band: parsed.overall, skill: 'writing' } }));
      setResult({ skill: 'writing', parsed, essay, prompt: currentExercise });
      setView('result');
    } catch (err) { console.error(err); setView('writing'); alert('Có lỗi khi chấm bài. Vui lòng thử lại.'); }
  };

  const goToCatalog = () => { setView('catalog'); setCurrentExercise(null); setResult(null); setSubmitted(false); setPassageImages([]); };
  const goToResult = () => { setShowSubmitSuccess(false); setView('result'); };

  if (view === 'grading') return <GradingScreen step={gradingStep} />;

  if (view === 'result') {
    if (result.skill === 'writing') return <WritingResult result={result} onBack={goToCatalog} onRetry={() => { setEssay(''); setTimeLeft(30 * 60); setView('writing'); }} />;
    return <ReadingListeningResult result={result} onBack={goToCatalog} />;
  }

  const timerUrgent = timeLeft < 120;

  // ── Reading / Listening ──
  if (view === 'reading' || view === 'listening') {
    const questions = currentExercise?.questions || [];
    const answered = Object.keys(answers).filter(k => answers[k]).length;

    const passagePanel = (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', marginBottom: 20, lineHeight: 1.3 }}>{currentExercise?.title}</h2>
        {passageImages.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {passageImages.map((img, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <img src={img.image_url} alt={img.caption || `Diagram ${i + 1}`}
                  style={{ width: '100%', borderRadius: 12, border: '2px solid #F0F0F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                />
                {img.caption && <div style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginTop: 6, textAlign: 'center' }}>{img.caption}</div>}
              </div>
            ))}
          </div>
        )}
        {(currentExercise?.text_en || currentExercise?.text || currentExercise?.transcript || '').split('\n\n').filter(Boolean).map((para, i) => (
          <p key={i} style={{ color: '#374151', fontSize: 16, lineHeight: 1.9, marginBottom: 18 }}>{para}</p>
        ))}
      </div>
    );

    const questionsPanel = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {view === 'listening' && currentExercise?.audio_url && <AudioPlayer url={currentExercise.audio_url} />}
        {questions.map((q, i) => (
          <div key={q.id} id={`q-${q.id}`} style={{
            background: '#fff', borderRadius: 18, padding: '20px 22px',
            border: `2px solid ${answers[q.id] ? '#BBDEFB' : '#F0F0F0'}`,
            boxShadow: answers[q.id] ? '0 4px 16px rgba(59,130,246,0.08)' : '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: answers[q.id] ? `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` : '#F3F4F6',
                color: answers[q.id] ? '#fff' : '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13
              }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1.5 }}>{q.question_text}</div>
                {q.question_vi && <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginTop: 4 }}>{q.question_vi}</div>}
              </div>
            </div>
            <QuestionItem q={q} index={i} answers={answers} setAnswers={setAnswers} />
          </div>
        ))}
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8F9FA', margin: '-32px', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{
          background: `linear-gradient(135deg, ${RD} 0%, ${R} 100%)`,
          padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <button onClick={() => setShowExitConfirm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
            borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 14
          }}>← Thoát</button>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', maxWidth: '50%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentExercise?.title}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px',
            borderRadius: 99,
            background: timerUrgent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
            border: '1.5px solid rgba(255,255,255,0.3)',
            animation: timerUrgent ? 'pulse 1s infinite' : 'none'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={timerUrgent ? R : '#fff'} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontWeight: 800, fontSize: 15, color: timerUrgent ? R : '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div style={{ height: 4, background: '#F0F0F0', flexShrink: 0 }}>
          <div style={{
            height: '100%', background: `linear-gradient(90deg, ${R} 0%, ${R3} 100%)`,
            width: `${(answered / Math.max(questions.length, 1)) * 100}%`,
            transition: 'width 0.3s ease'
          }}/>
        </div>

        {view === 'listening' ? (
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {currentExercise?.audio_url && <div style={{ marginBottom: 20 }}><AudioPlayer url={currentExercise.audio_url} /></div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{passagePanel}</div>
              <div>{questionsPanel}</div>
            </div>
          </div>
        ) : (
          <ResizablePanels
            left={<div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minHeight: '100%' }}>{passagePanel}</div>}
            right={questionsPanel}
          />
        )}

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
          @media(max-width:768px){ .exercise-grid { grid-template-columns: 1fr !important; } }
        `}</style>

        <div style={{
          height: 56, background: '#fff', borderTop: '2px solid #F0F0F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', marginRight: 4 }}>Q{questions.length}:</span>
            {questions.map((q, i) => {
              const done = !!answers[q.id];
              return (
                <div key={q.id}
                  onClick={() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                    background: done ? `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` : '#F3F4F6',
                    color: done ? '#fff' : '#9CA3AF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, transition: 'all 0.18s ease',
                    boxShadow: done ? `0 2px 8px rgba(185,28,28,0.35)` : 'none'
                  }}
                >{i + 1}</div>
              );
            })}
          </div>
          <button onClick={() => {
            const unanswered = questions.filter(q => !answers[q.id]).length;
            if (unanswered > 0) { setUnansweredCount(unanswered); setShowSubmitConfirm(true); }
            else handleExerciseSubmit();
          }} style={{
            padding: '10px 28px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)`,
            color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            boxShadow: `0 4px 14px rgba(185,28,28,0.4)`
          }}>Hoàn thành</button>
        </div>

        {showExitConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', width: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 10 }}>Bài test chưa hoàn thành</div>
              <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 24 }}>Bạn chưa làm xong bài test này. Bạn có chắc chắn muốn thoát không?</div>
              <button onClick={() => setShowExitConfirm(false)} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)`, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', marginBottom: 10 }}>Tiếp tục làm bài</button>
              <button onClick={() => { setShowExitConfirm(false); goToCatalog(); }} style={{ width: '100%', padding: '10px 0', background: 'none', border: 'none', color: R, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Thoát</button>
            </div>
          </div>
        )}

        {showSubmitConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', width: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 10 }}>Gửi bài chưa hoàn thành</div>
              <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 24 }}>Bài làm của bạn có <strong>{unansweredCount}</strong> câu chưa hoàn thành. Bạn có muốn tiếp tục gửi bài không?</div>
              <button onClick={() => setShowSubmitConfirm(false)} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)`, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', marginBottom: 10 }}>Ở lại làm bài</button>
              <button onClick={() => { setShowSubmitConfirm(false); handleExerciseSubmit(); }} style={{ width: '100%', padding: '10px 0', background: 'none', border: 'none', color: R, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Tiếp tục gửi bài</button>
            </div>
          </div>
        )}

        {showSubmitSuccess && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', width: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 10 }}>Gửi bài thành công</div>
              <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 24 }}>Chúc mừng bạn đã hoàn thành bài test. Hãy cùng xem kết quả nhé!</div>
              <button onClick={goToResult} style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)`, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Xem kết quả</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Writing ──
  if (view === 'writing') {
    const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
    const isTask1 = currentExercise?.task === 'task1';
    const minWords = currentExercise?.min_words || (isTask1 ? 150 : 250);
    const maxWords = currentExercise?.rec_words || (isTask1 ? 380 : 490);
    const wcColor = wordCount > maxWords ? '#DC2626' : wordCount < minWords ? R : wordCount < maxWords ? '#F59E0B' : '#22C55E';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: '-32px', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{
          background: `linear-gradient(135deg, ${RD} 0%, ${R} 100%)`,
          padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={goToCatalog} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#374151', fontWeight: 700, fontSize: 14 }}>← Thoát</button>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Writing — {isTask1 ? 'Task 1' : 'Task 2'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 99, border: `2px solid ${timeLeft < 120 ? R : 'rgba(255,255,255,0.4)'}`, background: timeLeft < 120 ? RL : 'rgba(255,255,255,0.15)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={timeLeft < 120 ? R : '#fff'} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontWeight: 800, fontSize: 16, color: timeLeft < 120 ? R : '#fff' }}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: '#F8F9FA' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 1200, margin: '0 auto', height: '100%' }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)`, color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 14px', borderRadius: 20 }}>
                  {isTask1 ? 'TASK 1' : 'TASK 2'}
                </span>
                {currentExercise?.type && <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600, textTransform: 'capitalize' }}>{currentExercise.type}</span>}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 14, lineHeight: 1.4 }}>{currentExercise?.title}</h3>
              {currentExercise?.prompt_vi && <div style={{ fontSize: 14, color: '#6B7280', fontStyle: 'italic', marginBottom: 16, padding: '12px 14px', background: '#F9FAFB', borderRadius: 10 }}>{currentExercise.prompt_vi}</div>}
              <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.8 }}>{currentExercise?.prompt_en}</div>
              <div style={{ marginTop: 16, padding: '10px 14px', background: RL, borderRadius: 10, fontSize: 13, color: R, fontWeight: 600 }}>
                📏 Tối thiểu {minWords} từ · Khuyến nghị {maxWords} từ · Tối đa {maxWords} từ
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#111' }}>Bài viết của bạn</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: wcColor, transition: 'color 0.3s' }}>{wordCount} từ</span>
              </div>
              <textarea
                value={essay}
                onChange={e => setEssay(e.target.value)}
                placeholder="Viết bài của bạn tại đây..."
                style={{
                  flex: 1, minHeight: 320, resize: 'none', outline: 'none',
                  border: `2px solid ${essay ? '#E5E7EB' : '#F0F0F0'}`,
                  borderRadius: 14, padding: '16px 18px', fontSize: 15, color: '#374151',
                  lineHeight: 1.8, fontFamily: 'inherit', transition: 'border 0.18s ease'
                }}
                onFocus={e => e.target.style.border = `2px solid ${R}`}
                onBlur={e => e.target.style.border = `2px solid ${essay ? '#E5E7EB' : '#F0F0F0'}`}
              />
              <div style={{ marginTop: 12, background: '#F0F0F0', borderRadius: 99, height: 6 }}>
                <div style={{ width: `${Math.min((wordCount / maxWords) * 100, 100)}%`, height: '100%', background: wcColor, borderRadius: 99, transition: 'all 0.3s ease' }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: wordCount >= minWords ? '#22C55E' : '#9CA3AF', fontWeight: 600 }}>✓ Min {minWords}</span>
                <span style={{ fontSize: 12, color: wordCount >= maxWords ? '#22C55E' : '#9CA3AF', fontWeight: 600 }}>✓ Rec {maxWords}</span>
              </div>
              <button
                onClick={handleWritingSubmit}
                disabled={wordCount < 50 || wordCount > maxWords}
                style={{
                  marginTop: 16, padding: '16px 0', borderRadius: 14, border: 'none',
                  background: (wordCount >= 50 && wordCount <= maxWords) ? `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` : '#F0F0F0',
                  color: (wordCount >= 50 && wordCount <= maxWords) ? '#fff' : '#9CA3AF',
                  fontSize: 16, fontWeight: 900, cursor: (wordCount >= 50 && wordCount <= maxWords) ? 'pointer' : 'not-allowed',
                  boxShadow: wordCount >= 50 ? `0 6px 20px rgba(185,28,28,0.35)` : 'none',
                  transition: 'all 0.2s ease'
                }}
              >Nộp bài →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Catalog ───────────────────────────────────────────────────────────────
  const typeList = activeSkill === 'reading' ? READING_TYPES : activeSkill === 'listening' ? LISTENING_TYPES : WRITING_TYPES;
  const currentType = activeType || typeList[0].value;
  const currentTypeConfig = typeList.find(t => t.value === currentType);

  const filteredExercises = exercises.filter(ex => {
    if (filterPro === 'pro') return ex.is_pro;
    if (filterPro === 'free') return !ex.is_pro;
    return true;
  });

  const PAGE_SIZE = 9;
  const totalPages = Math.ceil(filteredExercises.length / PAGE_SIZE);
  const pagedExercises = filteredExercises.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const SKILL_TABS = [
    {
      value: 'reading', label: 'Reading',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
    },
    {
      value: 'writing', label: 'Writing',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    },
  ];

  const getTypeAccuracy = (typeValue) => {
    const typeExercises = exercises.filter(ex => ex.question_type === typeValue);
    if (typeExercises.length === 0) return null;
    const done = typeExercises.filter(ex => completedMap[ex.id]).length;
    return Math.round((done / typeExercises.length) * 100);
  };

  return (
    <div style={{ margin: '-32px', minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: '#F8F9FA', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        .type-scroll::-webkit-scrollbar { width: 4px; }
        .type-scroll::-webkit-scrollbar-thumb { background: rgba(185,28,28,0.2); border-radius: 99px; }
        @media(max-width: 768px) {
          .catalog-layout { flex-direction: column !important; }
          .type-sidebar { width: 100% !important; height: auto !important; flex-direction: row !important; overflow-x: auto !important; overflow-y: hidden !important; padding: 8px !important; gap: 6px !important; }
          .type-sidebar button { min-width: 140px !important; flex-shrink: 0 !important; }
          .exercise-grid { grid-template-columns: 1fr !important; }
          .catalog-main { padding: 16px !important; }
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Header */}
      <div style={{
        background: `linear-gradient(140deg, #FEE2E2 0%, #FECACA 50%, #FCA5A5 100%)`,
        padding: '36px 36px 28px', position: 'relative', overflow: 'hidden',
        animation: 'fadeUp 0.4s cubic-bezier(.4,0,.2,1) both'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `radial-gradient(circle, ${R} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}/>
        <div style={{ position: 'absolute', top: -40, right: 60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
        <div style={{ position: 'absolute', bottom: -60, right: -20, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9B1C1C', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Đề luyện tập độc quyền</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#9B1C1C', marginBottom: 6, letterSpacing: -0.5 }}>Luyện theo dạng bài</h1>
          <p style={{ fontSize: 16, color: '#9B1C1C' }}>Trang bị đầy đủ kiến thức và kĩ năng cho kỳ thi</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
            {SKILL_TABS.map(s => (
              <button
                key={s.value}
                onClick={() => { setActiveSkill(s.value); setActiveType(null); setCurrentPage(1); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '11px 22px',
                  border: `2px solid ${activeSkill === s.value ? R : 'rgba(185,28,28,0.35)'}`,
                  background: activeSkill === s.value ? '#fff' : 'rgba(255,255,255,0.55)',
                  color: activeSkill === s.value ? R : '#7F1D1D',
                  fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  transition: 'all 0.2s ease', backdropFilter: 'blur(8px)',
                  boxShadow: activeSkill === s.value ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
                  transform: activeSkill === s.value ? 'translateY(-1px)' : 'translateY(0)',
                  borderRadius: 12,
                }}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="catalog-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div className="type-sidebar type-scroll" style={{
          width: 280, flexShrink: 0, background: '#fff',
          borderRight: '2px solid #F0F0F0', overflow: 'auto',
          padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4,
          animation: 'fadeUp 0.4s cubic-bezier(.4,0,.2,1) .1s both'
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Loại câu hỏi</span>
            <span style={{ color: R, background: RL, padding: '2px 8px', borderRadius: 20 }}>{typeList.length}</span>
          </div>
          {typeList.map(t => (
            <TypeItem
              key={t.value}
              type={t}
              isActive={currentType === t.value}
              onClick={() => { setActiveType(t.value); setCurrentPage(1); }}
              accuracy={getTypeAccuracy(t.value)}
            />
          ))}
        </div>

        {/* Main */}
        <div className="catalog-main" style={{ flex: 1, overflow: 'auto', padding: '24px 28px', animation: 'fadeUp 0.4s cubic-bezier(.4,0,.2,1) .18s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: RL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentTypeConfig && <currentTypeConfig.icon size={26} color={R} />}
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', marginBottom: 2 }}>{currentTypeConfig?.label}</h2>
                <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>
                  {catalogLoading ? 'Đang tải...' : `${filteredExercises.length} bài tập`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, background: '#F3F4F6', borderRadius: 12, padding: 4 }}>
              {[{ v: 'all', l: 'Tất cả' }, { v: 'free', l: 'Miễn phí' }, { v: 'pro', l: 'Pro' }].map(f => (
                <button key={f.v} onClick={() => { setFilterPro(f.v); setCurrentPage(1); }} style={{
                  padding: '8px 16px', borderRadius: 9, border: 'none',
                  background: filterPro === f.v ? '#fff' : 'transparent',
                  color: filterPro === f.v ? R : '#6B7280',
                  fontWeight: filterPro === f.v ? 800 : 600, fontSize: 14, cursor: 'pointer',
                  boxShadow: filterPro === f.v ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.18s ease',
                  display: 'flex', alignItems: 'center', gap: 5
                }}>
                  {f.v === 'pro' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={filterPro === 'pro' ? '#D97706' : '#6B7280'} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 20h20M4 16h16l2-10-5 4-5-8-5 8-5-4 2 10z"/>
                    </svg>
                  )}
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {catalogLoading ? (
            <div className="exercise-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ borderRadius: 20, height: 220, animation: 'shimmer 1.5s infinite', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%' }}/>
              ))}
            </div>
          ) : filteredExercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#374151', marginBottom: 8 }}>Chưa có bài tập nào</div>
              <div style={{ fontSize: 15, color: '#9CA3AF' }}>Thử chọn loại câu hỏi khác hoặc bộ lọc khác</div>
            </div>
          ) : (
            <>
              <div className="exercise-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                {pagedExercises.map((ex, idx) => (
                  <div key={ex.id} style={{ animation: `fadeUp 0.3s ease both`, animationDelay: `${idx * 0.05}s` }}>
                    <ExerciseCard
                      exercise={ex}
                      skill={activeSkill}
                      completed={completedMap[ex.id] || null}
                      isPremiumUser={isPremium}
                      onStart={handleStart}
                      onLocked={() => setShowProModal(true)}
                      typeConfig={currentTypeConfig}
                    />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #E5E7EB', background: currentPage === 1 ? '#F9FAFB' : '#fff', color: currentPage === 1 ? '#D1D5DB' : '#374151', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s ease' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  {(() => {
                    const pages = [];
                    
                    // Trang hiện tại + 2 trang tiếp theo (không vượt totalPages)
                    const leftPages = [];
                    for (let i = currentPage; i <= Math.min(currentPage + 2, totalPages); i++) {
                      leftPages.push(i);
                    }
                    
                    // 2 trang cuối
                    const rightPages = [];
                    for (let i = Math.max(totalPages - 1, 1); i <= totalPages; i++) {
                      rightPages.push(i);
                    }

                    // Gộp lại, loại trùng
                    const visible = new Set([...leftPages, ...rightPages]);
                    const sorted = [...visible].sort((a, b) => a - b);

                    let prev = null;
                    sorted.forEach(page => {
                      if (prev !== null && page - prev > 1) pages.push('...');
                      pages.push(page);
                      prev = page;
                    });

                    const btnStyle = (isActive) => ({
                      minWidth: 38, height: 38, padding: '0 6px',
                      borderRadius: 10,
                      border: `1.5px solid ${isActive ? R : '#E5E7EB'}`,
                      background: isActive ? `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` : '#fff',
                      color: isActive ? '#fff' : '#374151',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: 14, cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isActive ? `0 4px 12px rgba(185,28,28,0.3)` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    });

                    return pages.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`dots-${idx}`} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontWeight: 700, fontSize: 15 }}>
                            ···
                          </span>
                        );
                      }
                      const isActive = page === currentPage;
                      return (
                        <button key={page} onClick={() => setCurrentPage(page)} style={btnStyle(isActive)}>
                          {page}
                        </button>
                      );
                    });
                  })()}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #E5E7EB', background: currentPage === totalPages ? '#F9FAFB' : '#fff', color: currentPage === totalPages ? '#D1D5DB' : '#374151', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s ease' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal: PRO lock */}
      {showProModal && (
        <div
          onClick={() => setShowProModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeUp 0.2s ease both',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 24, padding: '40px 32px',
              width: 380, textAlign: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
              animation: 'fadeUp 0.25s cubic-bezier(.4,0,.2,1) both',
            }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(245,158,11,0.25)',
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h20M4 16h16l2-10-5 4-5-8-5 8-5-4 2 10z"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 10, letterSpacing: -0.3 }}>
              Tính năng Premium
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
              Nộp bài và nhận chấm điểm AI tức thì chỉ dành cho thành viên <strong style={{ color: '#D97706' }}>Premium</strong>. Nâng cấp ngay để trải nghiệm!
            </div>
            <button
              onClick={() => { setShowProModal(false); navigate('/subscription'); }}
              style={{
                width: '100%', padding: '15px 0',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                border: 'none', borderRadius: 14,
                color: '#fff', fontSize: 15, fontWeight: 800,
                cursor: 'pointer', letterSpacing: 0.2,
                boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
                transition: 'all 0.18s ease', marginBottom: 12,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Nâng cấp ngay
            </button>
            <button
              onClick={() => setShowProModal(false)}
              style={{ width: '100%', padding: '12px 0', background: 'none', border: 'none', color: '#9CA3AF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Để sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
