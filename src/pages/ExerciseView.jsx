import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getPassageWithQuestions } from '../lib/passages';
import { getListeningPassage } from '../lib/listening';
import { getPassageImages } from '../lib/passageImages';
import {
  gradeEssay,
  saveWritingSubmission,
  getWritingPrompts,
  checkAndIncrementGradingLimit,
} from '../lib/writing';
import { saveExerciseResult } from '../lib/exerciseResults';
import { bandFromScore } from '../lib/examResults';
import { supabase } from '../lib/supabase';

// ─── Theme ────────────────────────────────────────────────────────────────────
const R = '#C0392B';
const RL = '#FEF2F2';
const RB = '#E8C5C5';
const GRAY = '#6B7280';
const LIGHT = '#F9FAFB';
const BORDER = '#E5E7EB';

const BAR_H = 64; // top & bottom bar height (px) — unified
const TOPBAR_H = BAR_H;

const formatTime = (s) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const QUESTION_INSTRUCTIONS = {
  true_false:
    'Do the following statements agree with the information given in the reading passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.',
  yes_no:
    'Do the following statements agree with the views of the writer? Choose YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.',
  gap_filling:
    'Complete the sentences below. Write NO MORE THAN ONE WORD OR A NUMBER from the passage for each answer.',
  matching_headings:
    'The reading passage has several paragraphs. Choose the correct heading for each paragraph from the list of headings below.',
  matching_info:
    'The reading passage has several paragraphs. Which paragraph contains the following information?',
  matching_features:
    'Match each item with the correct option from the list below.',
  mcq_single: 'Choose the correct letter',
  mcq_multi: 'Choose the correct letters',
  diagram_label: 'Label the diagram',
  map_label: 'Label the map',
  map_diagram_label: 'Label the diagram',
  matching: 'Match each item with the correct option from the list below.',
};
const GRADING_STEPS = [
  'Đang đọc bài viết của bạn...',
  'Phân tích Task Response...',
  'Kiểm tra Coherence & Cohesion...',
  'Đánh giá Lexical Resource...',
  'Phân tích Grammar...',
  'Tính điểm tổng...',
];

// ─── SVG Icons (minimal, professional) ───────────────────────────────────────
const IconBack = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconClock = ({ color }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <polyline
      points="1.5,5.5 4.5,8.5 9.5,2.5"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconChevronDown = ({ color }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconSkipBack = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);
const IconSkipFwd = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="4" x2="19" y2="20" />
  </svg>
);
const IconPlay = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill={R}>
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const IconPause = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill={R}>
    <rect x="5" y="3" width="4" height="18" rx="1" />
    <rect x="15" y="3" width="4" height="18" rx="1" />
  </svg>
);

// ─── Audio Player (PREP-style) ─────────────────────────────────────────────
function AudioPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const toggle = () => {
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying((p) => !p);
  };
  const skip = (d) => {
    if (audioRef.current)
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime + d
      );
  };
  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (audioRef.current)
      audioRef.current.currentTime =
        ((e.clientX - rect.left) / rect.width) * duration;
  };

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: `1px solid ${BORDER}`,
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={(e) => {
          setElapsed(e.target.currentTime);
          setProgress(
            e.target.duration
              ? (e.target.currentTime / e.target.duration) * 100
              : 0
          );
        }}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Skip back 10s */}
      <button
        onClick={() => skip(-10)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: GRAY,
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          opacity: 0.75,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
        title="-10s"
      >
        <IconSkipBack />
      </button>

      {/* Play / Pause — no background circle, just the icon */}
      <button
        onClick={toggle}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          transition: 'transform 0.12s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? <IconPause /> : <IconPlay />}
      </button>

      {/* Skip fwd 10s */}
      <button
        onClick={() => skip(10)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: GRAY,
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          opacity: 0.75,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
        title="+10s"
      >
        <IconSkipFwd />
      </button>

      {/* Elapsed */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: GRAY,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 36,
        }}
      >
        {formatTime(Math.floor(elapsed))}
      </span>

      {/* Progress bar — PREP-style red fill */}
      <div
        onClick={seek}
        style={{
          flex: 1,
          height: 4,
          background: '#E9ECEF',
          borderRadius: 99,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${R} 0%, #E05C4E 100%)`,
            borderRadius: 99,
            transition: 'width 0.1s linear',
          }}
        />
        {/* Thumb dot */}
        <div
          style={{
            position: 'absolute',
            left: `${progress}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: R,
            boxShadow: `0 0 0 2px #fff, 0 0 0 3px ${RB}`,
            transition: 'left 0.1s linear',
          }}
        />
      </div>

      {/* Duration */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: GRAY,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 36,
          textAlign: 'right',
        }}
      >
        {formatTime(Math.floor(duration))}
      </span>
    </div>
  );
}
function CustomDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const listHeight = Math.min(options.length * 52 + 16, 280);
      setDropUp(spaceBelow < listHeight);
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: `1.5px solid ${value ? R : BORDER}`,
          borderRadius: 9,
          padding: '12px 14px',
          fontSize: 15,
          fontWeight: 500,
          background: value ? RL : '#fff',
          color: value ? R : '#9CA3AF',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          boxShadow: open ? `0 0 0 3px rgba(192,57,43,0.08)` : 'none',
        }}
      >
        <span
          style={{
            color: value ? R : '#9CA3AF',
            fontWeight: value ? 600 : 500,
          }}
        >
          {value || '— Chọn đáp án —'}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={value ? R : '#9CA3AF'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            [dropUp ? 'bottom' : 'top']: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 999,
            background: '#fff',
            border: `1.5px solid ${BORDER}`,
            borderRadius: 10,
            boxShadow: '0 8px 28px rgba(0,0,0,0.10)',
            overflow: 'hidden',
            maxHeight: 280,
            overflowY: 'auto',
            animation: `ddIn 0.15s cubic-bezier(.4,0,.2,1)`,
          }}
        >
          <style>{`
            @keyframes ddIn {
              from { opacity:0; transform:translateY(${
                dropUp ? '6px' : '-6px'
              }) }
              to   { opacity:1; transform:translateY(0) }
            }
            .dd-item {
              padding: 13px 16px; font-size: 15px; font-weight: 500;
              cursor: pointer; transition: background 0.12s, color 0.12s, transform 0.12s;
              color: #374151; border-bottom: 1px solid #F3F4F6;
            }
            .dd-item:last-child { border-bottom: none; }
            .dd-item:hover { background: #FEF2F2; color: #C0392B; transform: translateX(4px); }
            .dd-item-sel { background: #FEF2F2; color: #C0392B; font-weight: 700; }
          `}</style>
          {options.map((opt, i) => (
            <div
              key={i}
              className={`dd-item${value === opt ? ' dd-item-sel' : ''}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
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
// ─── Question renderer ────────────────────────────────────────────────────────
function QuestionItem({ q, answers, setAnswers }) {
  const type = q.question_type;
  const options = (() => {
    try {
      return typeof q.options === 'string'
        ? JSON.parse(q.options)
        : q.options || [];
    } catch {
      return [];
    }
  })();
  const set = (val) => setAnswers((a) => ({ ...a, [q.id]: val }));
  const answered = !!answers[q.id];

  const pill = (label, selected, onClick) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '9px 22px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        border: `1.5px solid ${selected ? R : BORDER}`,
        background: selected ? RL : '#fff',
        color: selected ? R : '#374151',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = RB;
          e.currentTarget.style.background = '#FAFAFA';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = BORDER;
          e.currentTarget.style.background = '#fff';
        }
      }}
    >
      {label}
    </button>
  );

  if (type === 'true_false' || type === 'yes_no') {
    const opts =
      type === 'true_false'
        ? ['True', 'False', 'Not Given']
        : ['Yes', 'No', 'Not Given'];
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {opts.map((o) => pill(o, answers[q.id] === o, () => set(o)))}
      </div>
    );
  }

  if (type === 'mcq_single') {
    const opts = options.length ? options : ['A', 'B', 'C', 'D'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opts.map((opt, i) => {
          const label =
            typeof opt === 'string' && opt.match(/^[A-D]\./)
              ? opt[0]
              : String.fromCharCode(65 + i);
          const sel = answers[q.id] === label;
          return (
            <button
              key={i}
              onClick={() => set(label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 9,
                border: `1.5px solid ${sel ? R : BORDER}`,
                background: sel ? RL : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!sel) {
                  e.currentTarget.style.borderColor = RB;
                  e.currentTarget.style.background = '#FAFAFA';
                }
              }}
              onMouseLeave={(e) => {
                if (!sel) {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.background = '#fff';
                }
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  background: sel ? R : '#F3F4F6',
                  color: sel ? '#fff' : GRAY,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: sel ? 600 : 400,
                  color: sel ? R : '#374151',
                }}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'mcq_multi') {
    const opts = options.length ? options : ['A', 'B', 'C', 'D'];
    const selected = answers[q.id] ? answers[q.id].split(',') : [];
    const toggle = (label) => {
      const next = selected.includes(label)
        ? selected.filter((x) => x !== label)
        : [...selected, label];
      set(next.join(','));
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opts.map((opt, i) => {
          const label =
            typeof opt === 'string' && opt.match(/^[A-D]\./)
              ? opt[0]
              : String.fromCharCode(65 + i);
          const sel = selected.includes(label);
          return (
            <button
              key={i}
              onClick={() => toggle(label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 9,
                border: `1.5px solid ${sel ? R : BORDER}`,
                background: sel ? RL : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!sel) {
                  e.currentTarget.style.borderColor = RB;
                  e.currentTarget.style.background = '#FAFAFA';
                }
              }}
              onMouseLeave={(e) => {
                if (!sel) {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.background = '#fff';
                }
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: `1.5px solid ${sel ? R : '#D1D5DB'}`,
                  background: sel ? R : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {sel && <IconCheck />}
              </div>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: GRAY,
                  flexShrink: 0,
                }}
              >
                {label}
              </div>
              <span
                style={{
                  fontSize: 15,
                  color: sel ? R : '#374151',
                  fontWeight: sel ? 600 : 400,
                }}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (
    [
      'matching_headings',
      'matching_info',
      'matching_features',
      'matching',
      'map_diagram_label',
    ].includes(type)
  ) {
    return (
      <CustomDropdown
        value={answers[q.id] || ''}
        onChange={set}
        options={options}
      />
    );
  }

  return (
    <input
      type="text"
      value={answers[q.id] || ''}
      onChange={(e) => set(e.target.value)}
      placeholder="Nhập câu trả lời..."
      style={{
        width: '100%',
        border: `1.5px solid ${answered ? R : BORDER}`,
        borderRadius: 9,
        padding: '12px 14px',
        fontSize: 15,
        fontWeight: 500,
        outline: 'none',
        background: answered ? RL : '#fff',
        color: '#374151',
        transition: 'all 0.15s',
      }}
      onFocus={(e) => {
        e.target.style.border = `1.5px solid ${R}`;
        e.target.style.boxShadow = `0 0 0 3px rgba(192,57,43,0.08)`;
      }}
      onBlur={(e) => {
        e.target.style.border = `1.5px solid ${answers[q.id] ? R : BORDER}`;
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

// ─── Resizable split panels ───────────────────────────────────────────────────
function SplitPanels({ left, right }) {
  const [split, setSplit] = useState(52);
  const dragging = useRef(false);
  const ref = useRef(null);

  const onMD = (e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.userSelect = 'none';
  };
  const onMM = (e) => {
    if (!dragging.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setSplit(
      Math.min(72, Math.max(28, ((e.clientX - rect.left) / rect.width) * 100))
    );
  };
  const onMU = () => {
    dragging.current = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', onMU);
    return () => {
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', onMU);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}
    >
      {/* FIX #1: overflow-y: auto so passage can scroll */}
      <div
        style={{ width: `${split}%`, overflowY: 'auto', padding: '28px 32px' }}
      >
        {left}
      </div>
      <div
        onMouseDown={onMD}
        style={{
          width: 5,
          flexShrink: 0,
          background: BORDER,
          cursor: 'col-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = RB)}
        onMouseLeave={(e) => (e.currentTarget.style.background = BORDER)}
      >
        <div
          style={{
            width: 2,
            height: 40,
            background: '#D1D5DB',
            borderRadius: 99,
          }}
        />
      </div>
      {/* FIX #1: overflow-y: auto so questions can scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px' }}>
        {right}
      </div>
    </div>
  );
}

// ─── Reading/Listening Result — split layout ──────────────────────────────────
function ReadingListeningResult({
  result,
  onBack,
  exercise,
  userName,
  profile,
}) {
  const [expandedExplanation, setExpandedExplanation] = useState(null);
  const correct = result.score;
  const total = result.total;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const passageText =
    exercise?.text_en || exercise?.text || exercise?.transcript || '';
  const title = exercise?.title || '';
  const isListening = result.skill === 'listening';

  // Avatar initials
  const initials = (userName || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F8F9FA',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          height: BAR_H,
          background: '#fff',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 16px',
            borderRadius: 9,
            border: `1px solid ${BORDER}`,
            background: '#fff',
            color: '#374151',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = LIGHT;
            e.currentTarget.style.borderColor = RB;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = BORDER;
          }}
        >
          <IconBack />
          Quay lại
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
            {isListening ? 'Listening' : 'Reading'} — Kết quả
          </div>
        </div>

        {/* Spacer to balance left button */}
        <div style={{ width: 100, flexShrink: 0 }} />
      </div>

      {/* ── User + score header card ── */}
      <div
        style={{
          background: '#fff',
          borderBottom: `1px solid ${BORDER}`,
          padding: '16px 28px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              background: '#DBEAFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 800,
              color: '#1D4ED8',
            }}
          >
            {initials}
          </div>

          {/* Name + date */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#111',
                marginBottom: 2,
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: 13, color: GRAY }}>{dateStr}</div>
          </div>

          {/* Điểm % */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: GRAY,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              Điểm %
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>
              <span
                style={{
                  color: pct >= 70 ? '#16A34A' : pct >= 40 ? '#D97706' : R,
                }}
              >
                {pct}
              </span>
              <span style={{ fontSize: 14, color: GRAY, fontWeight: 600 }}>
                /100
              </span>
            </div>
          </div>

          <div
            style={{ width: 1, height: 40, background: BORDER, flexShrink: 0 }}
          />

          {/* Câu hỏi đúng */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 11,
                color: GRAY,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              Câu hỏi đúng
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>
              <span style={{ color: '#16A34A' }}>{correct}</span>
              <span style={{ fontSize: 14, color: GRAY, fontWeight: 600 }}>
                /{total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Split body ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* LEFT — passage */}
        <div
          style={{
            width: '50%',
            overflowY: 'auto',
            borderRight: `1px solid ${BORDER}`,
            padding: '28px 32px',
            background: '#fff',
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#111',
              marginBottom: 20,
              lineHeight: 1.35,
            }}
          >
            {title}
          </h2>
          {passageText ? (
            passageText
              .split('\n\n')
              .filter(Boolean)
              .map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 15,
                    color: '#374151',
                    lineHeight: 1.9,
                    marginBottom: 18,
                  }}
                >
                  {para}
                </p>
              ))
          ) : (
            <div style={{ fontSize: 14, color: GRAY, fontStyle: 'italic' }}>
              Không có nội dung passage.
            </div>
          )}
        </div>

        {/* RIGHT — questions + answers */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 24px',
            background: LIGHT,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Instruction banner */}
            {exercise?.question_type &&
              QUESTION_INSTRUCTIONS[exercise.question_type] && (
                <div
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 10,
                    padding: '11px 16px',
                    fontSize: 13,
                    color: '#1E40AF',
                    lineHeight: 1.6,
                  }}
                >
                  {QUESTION_INSTRUCTIONS[exercise.question_type]}
                </div>
              )}

            {result.questions.map((q, i) => {
              const ua = (result.answers[q.id] || '')
                .toString()
                .trim()
                .toLowerCase();
              const ca = (q.correct_answer || '')
                .toString()
                .trim()
                .toLowerCase();
              const ok = ua === ca;
              const expOpen = expandedExplanation === q.id;

              return (
                <div
                  key={q.id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: `1.5px solid ${ok ? '#BBF7D0' : '#FECACA'}`,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  {/* Question row */}
                  <div style={{ padding: '16px 18px' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Number badge */}
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: ok ? '#22C55E' : R,
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {i + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#111',
                            lineHeight: 1.55,
                            marginBottom: 10,
                          }}
                        >
                          {q.question_text}
                        </div>

                        {/* Answer row */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* User answer */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 7,
                              background: ok ? '#F0FDF4' : '#FFF5F5',
                              border: `1px solid ${ok ? '#BBF7D0' : '#FECACA'}`,
                            }}
                          >
                            {ok ? (
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#16A34A"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={R}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            )}
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: ok ? '#16A34A' : R,
                              }}
                            >
                              {result.answers[q.id] || '(chưa trả lời)'}
                            </span>
                          </div>

                          {/* Correct answer (only if wrong) */}
                          {!ok && (
                            <>
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={GRAY}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 12px',
                                  borderRadius: 7,
                                  background: '#F0FDF4',
                                  border: '1px solid #BBF7D0',
                                }}
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#16A34A"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#16A34A',
                                  }}
                                >
                                  {q.correct_answer}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Explanation toggle — only if has explanation */}
                      {q.explanation && (
                        <button
                          onClick={() =>
                            setExpandedExplanation(expOpen ? null : q.id)
                          }
                          style={{
                            flexShrink: 0,
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: `1px solid ${BORDER}`,
                            background: expOpen ? '#EFF6FF' : '#fff',
                            color: expOpen ? '#1D4ED8' : GRAY,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!expOpen) {
                              e.currentTarget.style.background = LIGHT;
                              e.currentTarget.style.borderColor = RB;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!expOpen) {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.borderColor = BORDER;
                            }
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Giải thích
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: expOpen
                                ? 'rotate(180deg)'
                                : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Explanation panel */}
                  {q.explanation && expOpen && (
                    <div
                      style={{
                        borderTop: '1px solid #EFF6FF',
                        background: '#F8FAFF',
                        padding: '14px 18px 14px 60px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'flex-start',
                        }}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#1D4ED8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        >
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                        <div
                          style={{
                            fontSize: 13,
                            color: '#374151',
                            lineHeight: 1.7,
                            fontStyle: 'italic',
                          }}
                        >
                          {q.explanation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function WritingResult({ result, onBack, onRetry }) {
  const [tab, setTab] = useState('feedback');
  const { parsed, essay, prompt } = result;
  const criteria = [
    { label: 'Task Response', score: parsed.ta, text: parsed.taskResponse },
    { label: 'Coherence & Cohesion', score: parsed.cc, text: parsed.coherence },
    { label: 'Lexical Resource', score: parsed.lr, text: parsed.lexical },
    { label: 'Grammatical Range', score: parsed.gra, text: parsed.grammar },
  ];
  return (
    <div
      style={{ minHeight: '100vh', background: LIGHT, padding: '48px 16px' }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div
          style={{
            background: '#fff',
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            padding: '36px 32px',
            marginBottom: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 40,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: GRAY,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                Overall
              </div>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 900,
                  color: R,
                  lineHeight: 1,
                }}
              >
                {parsed.overall ?? '–'}
              </div>
              {parsed.overall != null && (
                <div
                  style={{
                    fontSize: 13,
                    color: GRAY,
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  ± 0.5
                </div>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                flex: 1,
              }}
            >
              {criteria.map((c) => (
                <div
                  key={c.label}
                  style={{
                    background: LIGHT,
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: GRAY,
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    {c.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>
                    {c.score ?? '–'}
                  </div>
                  <div
                    style={{
                      background: BORDER,
                      borderRadius: 99,
                      height: 3,
                      marginTop: 6,
                    }}
                  >
                    <div
                      style={{
                        width: c.score ? `${(c.score / 9) * 100}%` : 0,
                        height: '100%',
                        background: R,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: '#fff',
            borderRadius: 12,
            padding: 5,
            marginBottom: 16,
            border: `1px solid ${BORDER}`,
            width: 'fit-content',
          }}
        >
          {[
            { v: 'feedback', l: 'Nhận xét' },
            { v: 'essay', l: 'Bài của bạn' },
            { v: 'model', l: 'Bài mẫu' },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: tab === t.v ? R : 'transparent',
                color: tab === t.v ? '#fff' : GRAY,
                fontWeight: tab === t.v ? 700 : 500,
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              {t.l}
            </button>
          ))}
        </div>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
            border: `1px solid ${BORDER}`,
          }}
        >
          {tab === 'essay' && (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: 15,
                lineHeight: 1.85,
                color: '#374151',
              }}
            >
              {essay}
            </div>
          )}
          {tab === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {parsed.strengths && (
                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1.5px solid #BBF7D0',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#15803D',
                      marginBottom: 6,
                      fontSize: 14,
                    }}
                  >
                    Điểm mạnh
                  </div>
                  <div
                    style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{
                      __html: (parsed.strengths || '').replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong>$1</strong>'
                      ),
                    }}
                  />
                </div>
              )}
              {criteria.map((c) => (
                <div
                  key={c.label}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{ fontWeight: 700, fontSize: 14, color: '#111' }}
                    >
                      {c.label}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: R }}>
                      {c.score ?? '–'}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{
                      __html: (c.text || '').replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong>$1</strong>'
                      ),
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {tab === 'model' &&
            (prompt?.sample_essay ? (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: 15,
                  lineHeight: 1.85,
                  color: '#374151',
                }}
              >
                {prompt.sample_essay}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#9CA3AF',
                  padding: '40px 0',
                  fontSize: 14,
                }}
              >
                Chưa có bài mẫu cho đề này
              </div>
            ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              border: `1.5px solid ${BORDER}`,
              background: '#fff',
              color: '#374151',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Quay lại
          </button>
          <button
            onClick={onRetry}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              border: 'none',
              background: R,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: `0 4px 14px rgba(192,57,43,0.25)`,
            }}
          >
            Viết lại
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grading screen ───────────────────────────────────────────────────────────
function GradingScreen({ step }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(160deg, #7F1D1D 0%, #B91C1C 50%, #EF4444 100%)',
        flexDirection: 'column',
        gap: 20,
        padding: 16,
      }}
    >
      <img
        src="/ielts-logo.png"
        alt="IELTS Instructor"
        style={{
          height: 56,
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)',
        }}
      />
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: 0.3,
        }}
      >
        {GRADING_STEPS[step]}
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              animation: 'bounce 1.2s infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({
  emoji,
  title,
  body,
  primaryLabel,
  primaryAction,
  secondaryLabel,
  secondaryAction,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '32px 28px',
          width: 360,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'popIn 0.2s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}`}</style>
        {emoji && <div style={{ fontSize: 40, marginBottom: 14 }}>{emoji}</div>}
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#111',
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: GRAY,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          {body}
        </div>
        <button
          onClick={primaryAction}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 10,
            border: 'none',
            background: R,
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          {primaryLabel}
        </button>
        {secondaryLabel && (
          <button
            onClick={secondaryAction}
            style={{
              width: '100%',
              padding: '10px',
              background: 'none',
              border: 'none',
              color: R,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
// FIX #3: taller bar, logo không bọc đỏ, scale up, icons to hơn
function TopBar({ onExit, title, timeLeft }) {
  const urgent = timeLeft !== null && timeLeft < 120;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: TOPBAR_H,
        background: '#fff',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: 16,
      }}
    >
      {/* Left */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onExit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 16px',
            borderRadius: 9,
            border: `1px solid ${BORDER}`,
            background: '#fff',
            color: '#374151',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = LIGHT;
            e.currentTarget.style.borderColor = RB;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = BORDER;
          }}
        >
          <IconBack />
          Thoát
        </button>

        {/* FIX #3: logo — white bg, no red wrap, larger image */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/ielts-logo.png"
            alt="IELTS Instructor"
            style={{ height: 34, objectFit: 'contain' }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#111',
                letterSpacing: 0.2,
              }}
            >
              IELTS
            </div>
            <div style={{ fontSize: 11, color: GRAY, letterSpacing: 0.3 }}>
              Instructor
            </div>
          </div>
        </div>
      </div>

      {/* Center */}
      <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#111',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>

      {/* Right: timer */}
      {timeLeft !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 9,
            border: `1px solid ${urgent ? RB : BORDER}`,
            background: urgent ? RL : LIGHT,
            flexShrink: 0,
            animation: urgent ? 'timerPulse 1s infinite' : 'none',
          }}
        >
          <IconClock color={urgent ? R : GRAY} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: urgent ? R : '#374151',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      )}
      <style>{`@keyframes timerPulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
    </div>
  );
}

// ─── Bottom Bar ───────────────────────────────────────────────────────────────
// FIX #3: same height as TopBar, dots + submit button bigger
function BottomBar({ questions, answers, onSubmit }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: BAR_H,
        background: '#fff',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: 12,
      }}
    >
      {/* Question dots */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {questions.map((q, i) => {
          const done = !!answers[q.id];
          return (
            <button
              key={q.id}
              onClick={() =>
                document
                  .getElementById(`q-${q.id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
              title={`Câu ${i + 1}`}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: `2px solid ${done ? R : BORDER}`,
                background: done ? R : '#fff',
                color: done ? '#fff' : '#9CA3AF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.15)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = 'scale(1)')
              }
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      {/* Submit */}
      <button
        onClick={onSubmit}
        style={{
          padding: '11px 28px',
          borderRadius: 10,
          border: 'none',
          background: R,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'opacity 0.15s',
          flexShrink: 0,
          boxShadow: `0 3px 12px rgba(192,57,43,0.25)`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Hoàn thành
      </button>
    </div>
  );
}

// ─── Main ExerciseView ────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onUpgrade }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 22, padding: 32,
        width: 'min(380px, 90vw)', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        animation: 'dropIn 0.2s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-8px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(245,158,11,0.25)',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20h20M4 16h16l2-10-5 4-5-8-5 8-5-4 2 10z"/>
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 10 }}>
          Tính năng Premium
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.7 }}>
          Nộp bài và nhận chấm điểm AI tức thì chỉ dành cho thành viên{' '}
          <strong style={{ color: '#D97706' }}>Premium</strong>. Nâng cấp ngay để trải nghiệm!
        </div>
        <button onClick={onUpgrade} style={{
          width: '100%', padding: '14px 0',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(245,158,11,0.4)', marginBottom: 10,
        }}>
          Nâng cấp ngay
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 13, color: '#9CA3AF', cursor: 'pointer', padding: '6px 0' }}>
          Để sau
        </button>
      </div>
    </div>
  );
}
export default function ExerciseView({ user, profile }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const skill = searchParams.get('skill') || 'reading';

  const [exercise, setExercise] = useState(null);
  const [passageImages, setPassageImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [view, setView] = useState('exercise');
  const [gradingStep, setGradingStep] = useState(0);
  const [essay, setEssay] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Modals
  const [exitModal, setExitModal] = useState(false);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [unanswered, setUnanswered] = useState(0);

  // FIX #7: writing split state
  const [writingSplit, setWritingSplit] = useState(50);
  const writingDragging = useRef(false);
  const writingRef = useRef(null);

  const onWritingMD = (e) => {
    e.preventDefault();
    writingDragging.current = true;
    document.body.style.userSelect = 'none';
  };
  const onWritingMM = (e) => {
    if (!writingDragging.current || !writingRef.current) return;
    const rect = writingRef.current.getBoundingClientRect();
    setWritingSplit(
      Math.min(70, Math.max(30, ((e.clientX - rect.left) / rect.width) * 100))
    );
  };
  const onWritingMU = () => {
    writingDragging.current = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    window.addEventListener('mousemove', onWritingMM);
    window.addEventListener('mouseup', onWritingMU);
    return () => {
      window.removeEventListener('mousemove', onWritingMM);
      window.removeEventListener('mouseup', onWritingMU);
    };
  }, []);

  // Load exercise
  useEffect(() => {
    const load = async () => {
      try {
        let data;
        if (skill === 'reading') {
          data = await getPassageWithQuestions(id);
          const imgs = await getPassageImages(id);
          setPassageImages(imgs);
          setTimeLeft(20 * 60);
        } else if (skill === 'listening') {
          // FIX #5: getListeningPassage already returns { ...passage, questions }
          data = await getListeningPassage(id);
          const imgs = await getPassageImages(id);
          setPassageImages(imgs);
          setTimeLeft(40 * 60);
        } else {
          const { data: prompts } = await supabase
            .from('writing_prompts')
            .select('*')
            .eq('id', id)
            .single();
          data = prompts;
          setTimeLeft(prompts?.task === 'task1' ? 20 * 60 : 40 * 60);
        }
        setExercise(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, skill]);

  // Timer
  useEffect(() => {
    if (view !== 'exercise' || submitted || timeLeft === null || timeLeft <= 0)
      return;
    const t = setTimeout(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          if (skill !== 'writing') handleSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft, view, submitted]);

  // Grading animation
  useEffect(() => {
    if (view !== 'grading') return;
    const t = setInterval(
      () => setGradingStep((s) => Math.min(s + 1, GRADING_STEPS.length - 1)),
      1500
    );
    return () => clearInterval(t);
  }, [view]);

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    const questions = exercise?.questions || [];
    let correct = 0;
    questions.forEach((q) => {
      if (
        (answers[q.id] || '').toString().trim().toLowerCase() ===
        (q.correct_answer || '').toString().trim().toLowerCase()
      )
        correct++;
    });
    const total = questions.length;
    const band = bandFromScore(correct);
    try {
      await saveExerciseResult({
        userId: user.id,
        exerciseId: exercise.id,
        skill,
        questionType: exercise.question_type,
        score: correct,
        total,
        band,
      });
    } catch (e) {
      console.error(e);
    }
    setResult({
      skill,
      band,
      score: correct,
      total,
      questions,
      answers: { ...answers },
    });
    setSuccessModal(true);
  };

  const handleWritingSubmit = async () => {
    const wc = essay.trim() ? essay.trim().split(/\s+/).length : 0;
    const isTask1 = exercise?.task === 'task1';
    const maxWords = exercise?.rec_words || (isTask1 ? 350 : 450);
  
    if (!profile?.plan || profile.plan !== 'premium') {
      setShowUpgradeModal(true);
      return;
    }
    if (wc < 50) {
      alert('Bài viết quá ngắn (tối thiểu 50 từ).');
      return;
    }
    if (wc > maxWords) {
      alert(`Bài viết quá dài (tối đa ${maxWords} từ).`);
      return;
    }
    try {
      await checkAndIncrementGradingLimit(user.id, 10);
    } catch (e) {
      if (e.message === 'LIMIT_REACHED') {
        alert(
          'Bạn đã dùng hết 10 lượt chấm bài hôm nay. Vui lòng thử lại vào ngày mai! '
        );
        return;
      }
    }
    setGradingStep(0);
    setView('grading');
    try {
      const parsed = await gradeEssay(
        essay,
        exercise.prompt_en,
        exercise.task,
        exercise.image_url
      );
      await saveWritingSubmission({
        userId: user.id,
        promptId: exercise.id,
        essay,
        bandOverall: parsed.overall,
        bandTa: parsed.ta,
        bandCc: parsed.cc,
        bandLr: parsed.lr,
        bandGra: parsed.gra,
        feedback: {
          strengths: parsed.strengths,
          taskResponse: parsed.taskResponse,
          coherence: parsed.coherence,
          lexical: parsed.lexical,
          grammar: parsed.grammar,
        },
        mistakes: null,
      });
      await saveExerciseResult({
        userId: user.id,
        exerciseId: exercise.id,
        skill: 'writing',
        questionType: exercise.task,
        score: null,
        total: null,
        band: parsed.overall,
      });
      setResult({ skill: 'writing', parsed, essay, prompt: exercise });
      setView('result');
    } catch (e) {
      console.error(e);
      setView('exercise');
      alert('Có lỗi khi chấm bài.');
    }
  };

  const goBack = () => navigate('/testpractice');

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(160deg, #7F1D1D 0%, #B91C1C 50%, #EF4444 100%)`,
          gap: 20,
        }}
      >
        <img
          src="/ielts-logo.png"
          alt="IELTS Instructor"
          style={{
            height: 56,
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.8)',
                animation: 'bounce 1.2s infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
      </div>
    );

  if (view === 'grading') return <GradingScreen step={gradingStep} />;
  if (view === 'result') {
    if (result?.skill === 'writing')
      return (
        <WritingResult
          result={result}
          onBack={goBack}
          onRetry={() => {
            setEssay('');
            setTimeLeft(skill === 'task1' ? 20 * 60 : 40 * 60);
            setView('exercise');
          }}
        />
      );
    return (
      <ReadingListeningResult
        result={result}
        onBack={goBack}
        exercise={exercise}
        userName={profile?.full_name || user?.email || 'Bạn'}
        profile={profile}
      />
    );
  }

  const questions = exercise?.questions || [];
  const answered = Object.keys(answers).filter((k) => answers[k]).length;
  const title = exercise?.title || '';
  const isWriting =
    skill === 'writing' || skill === 'task1' || skill === 'task2';
  const isListening = skill === 'listening';

  // ── Writing view ─────────────────────────────────────────────────────────
  if (isWriting) {
    const isTask1 = exercise?.task === 'task1' || skill === 'task1';
    const minWords = exercise?.min_words || (isTask1 ? 150 : 250);
    const maxWords = exercise?.rec_words || (isTask1 ? 350 : 450);
    const wc = essay.trim() ? essay.trim().split(/\s+/).length : 0;
    const wcColor =
      wc > maxWords
        ? R
        : wc >= minWords
        ? '#22C55E'
        : wc > 0
        ? '#F59E0B'
        : '#9CA3AF';

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#fff',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <TopBar
          onExit={() => setExitModal(true)}
          title={title}
          timeLeft={timeLeft}
        />

        {/* FIX #7: resizable writing split */}
        <div
          ref={writingRef}
          style={{
            paddingTop: TOPBAR_H,
            height: '100vh',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          {/* Prompt panel */}
          <div
            style={{
              width: `${writingSplit}%`,
              overflowY: 'auto',
              borderRight: `1px solid ${BORDER}`,
              padding: '32px 36px',
            }}
          >
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 4 }}>
              {isTask1
                ? 'You should spend about 20 minutes on this task.'
                : 'You should spend about 40 minutes on this task.'}
            </div>
            <div
              style={{
                fontSize: 16,
                color: '#374151',
                lineHeight: 1.85,
                marginBottom: 4,
                fontWeight: 700,
              }}
            >
              {exercise?.prompt_en}
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#374151',
                marginBottom: 16,
                whiteSpace: 'pre-line',
              }}
            >
              {isTask1
                ? 'Write at least 150 words.'
                : 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.'}
            </div>
            {exercise?.image_url && (
              <img
                src={exercise.image_url}
                alt="Task 1 chart"
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                }}
              />
            )}
          </div>

          {/* FIX #7: drag handle */}
          <div
            onMouseDown={onWritingMD}
            style={{
              width: 5,
              flexShrink: 0,
              background: BORDER,
              cursor: 'col-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = RB)}
            onMouseLeave={(e) => (e.currentTarget.style.background = BORDER)}
          >
            <div
              style={{
                width: 2,
                height: 40,
                background: '#D1D5DB',
                borderRadius: 99,
              }}
            />
          </div>

          {/* Essay panel */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                Bài viết của bạn
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: wcColor,
                  transition: 'color 0.3s',
                }}
              >
                {wc} từ
              </span>
            </div>
            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Viết bài tại đây..."
              style={{
                flex: 1,
                resize: 'none',
                outline: 'none',
                border: 'none',
                padding: '20px 24px',
                fontSize: 15,
                color: '#374151',
                lineHeight: 1.85,
                fontFamily: 'inherit',
              }}
            />
            <div
              style={{
                padding: '12px 24px',
                borderTop: `1px solid ${BORDER}`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  background: '#F3F4F6',
                  borderRadius: 99,
                  height: 4,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: `${Math.min((wc / maxWords) * 100, 100)}%`,
                    height: '100%',
                    background: wcColor,
                    borderRadius: 99,
                    transition: 'all 0.3s',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: '#9CA3AF',
                  marginBottom: 12,
                }}
              >
                <span style={{ color: wc >= minWords ? '#22C55E' : '#9CA3AF' }}>
                  Min {minWords}
                </span>
                <span style={{ color: wc >= maxWords ? '#22C55E' : '#9CA3AF' }}>
                  Rec {maxWords}
                </span>
              </div>
              <button
                onClick={handleWritingSubmit}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 10,
                  border: 'none',
                  background: wc >= 50 && wc <= maxWords ? R : '#F3F4F6',
                  color: wc >= 50 && wc <= maxWords ? '#fff' : '#9CA3AF',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>

        {exitModal && (
          <Modal
            title="Thoát bài viết?"
            body="Bài viết của bạn sẽ không được lưu nếu thoát."
            primaryLabel="Tiếp tục viết"
            primaryAction={() => setExitModal(false)}
            secondaryLabel="Thoát"
            secondaryAction={() => {
              setExitModal(false);
              goBack();
            }}
          />
        )}
        {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} onUpgrade={() => { setShowUpgradeModal(false); navigate('/subscription') }} />}
      </div>
    );
  }

  // ── Shared passage / questions panels ────────────────────────────────────
  const isMapLabel = [
    'map_label',
    'diagram_label',
    'map_diagram_label',
  ].includes(exercise?.question_type);
  const passageText =
    exercise?.text_en || exercise?.text || exercise?.transcript || '';

  // FIX #2: For map/diagram reading — images move to the right (questions) panel
  // Images appear at TOP of questions panel, answers below — like PREP
  const passagePanel = (
    <div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#111',
          marginBottom: 22,
          lineHeight: 1.35,
        }}
      >
        {exercise?.title}
      </h2>
      {/* Reading non-map images stay in passage panel */}
      {passageImages.length > 0 && !isListening && !isMapLabel && (
        <div style={{ marginBottom: 24 }}>
          {passageImages.map((img, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <img
                src={img.image_url}
                alt={img.caption || ''}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                }}
              />
              {img.caption && (
                <div
                  style={{
                    fontSize: 12,
                    color: GRAY,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    marginTop: 6,
                  }}
                >
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {passageText
        .split('\n\n')
        .filter(Boolean)
        .map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: 15,
              color: '#374151',
              lineHeight: 1.9,
              marginBottom: 18,
            }}
          >
            {p}
          </p>
        ))}
    </div>
  );

  // FIX #6: Questions panel — wider, bigger font for listening
  const questionsPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* FIX #2 & #5 & #6: Images in questions panel for map/diagram (reading) or listening */}
      {exercise?.question_type &&
        QUESTION_INSTRUCTIONS[exercise.question_type] && (
          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              color: '#1E40AF',
              lineHeight: 1.6,
              marginBottom: 4,
            }}
          >
            {QUESTION_INSTRUCTIONS[exercise.question_type]}
          </div>
        )}

      {(isMapLabel || isListening) && passageImages.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {passageImages.map((img, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <img
                src={img.image_url}
                alt={img.caption || ''}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                }}
              />
              {img.caption && (
                <div
                  style={{
                    fontSize: 12,
                    color: GRAY,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    marginTop: 6,
                  }}
                >
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FIX #5: questions comes from getListeningPassage which already joins passage_questions */}
      {questions.map((q, i) => (
        <div
          key={q.id}
          id={`q-${q.id}`}
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: isListening ? '20px 24px' : '18px 20px',
            border: `1.5px solid ${answers[q.id] ? RB : BORDER}`,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: answers[q.id]
              ? `0 2px 12px rgba(192,57,43,0.07)`
              : '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                flexShrink: 0,
                fontSize: isListening ? 14 : 13,
                fontWeight: 800,
                background: answers[q.id] ? RL : '#F3F4F6',
                color: answers[q.id] ? R : GRAY,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {i + 1}
            </div>
            <div>
              {/* FIX #6: bigger font for listening */}
              <div
                style={{
                  fontSize: isListening ? 16 : 14,
                  fontWeight: 600,
                  color: '#111',
                  lineHeight: 1.55,
                }}
              >
                {q.question_text}
              </div>
              {q.question_vi && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#9CA3AF',
                    fontStyle: 'italic',
                    marginTop: 3,
                  }}
                >
                  {q.question_vi}
                </div>
              )}
            </div>
          </div>
          <QuestionItem q={q} answers={answers} setAnswers={setAnswers} />
        </div>
      ))}
    </div>
  );

  // ── Listening layout ──────────────────────────────────────────────────────
  if (isListening) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <TopBar
          onExit={() => setExitModal(true)}
          title={title}
          timeLeft={timeLeft}
        />

        {/* Progress strip */}
        <div
          style={{
            position: 'fixed',
            top: TOPBAR_H,
            left: 0,
            right: 0,
            zIndex: 99,
            height: 3,
            background: '#F3F4F6',
          }}
        >
          <div
            style={{
              width: `${(answered / Math.max(questions.length, 1)) * 100}%`,
              height: '100%',
              background: R,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* FIX #8: new audio player below top bar, sticky */}
        <div
          style={{
            position: 'fixed',
            top: TOPBAR_H + 3,
            left: 0,
            right: 0,
            zIndex: 98,
          }}
        >
          {exercise?.audio_url && <AudioPlayer url={exercise.audio_url} />}
        </div>

        {/* FIX #6: centered, widened questions */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: TOPBAR_H + 3 + (exercise?.audio_url ? 56 : 0),
            paddingBottom: BAR_H,
          }}
        >
          <div
            style={{
              maxWidth: 780, // FIX #6: wider
              margin: '0 auto',
              padding: '28px 24px',
            }}
          >
            {/* Passage info / transcript snippet if exists */}
            {passageText && (
              <div
                style={{
                  background: LIGHT,
                  borderRadius: 16,
                  padding: '20px 24px',
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#111',
                    marginBottom: 14,
                  }}
                >
                  {exercise?.title}
                </h2>
                {passageText
                  .split('\n\n')
                  .filter(Boolean)
                  .map((p, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: 15,
                        color: '#374151',
                        lineHeight: 1.9,
                        marginBottom: 14,
                      }}
                    >
                      {p}
                    </p>
                  ))}
              </div>
            )}
            {questionsPanel}
          </div>
        </div>

        <BottomBar
          questions={questions}
          answers={answers}
          onSubmit={() => {
            const un = questions.filter((q) => !answers[q.id]).length;
            if (un > 0) {
              setUnanswered(un);
              setSubmitConfirm(true);
            } else handleSubmit();
          }}
        />

        {exitModal && (
          <Modal
            title="Thoát bài test?"
            body="Tiến độ hiện tại sẽ không được lưu."
            primaryLabel="Tiếp tục làm bài"
            primaryAction={() => setExitModal(false)}
            secondaryLabel="Thoát"
            secondaryAction={() => {
              setExitModal(false);
              goBack();
            }}
          />
        )}
        {submitConfirm && (
          <Modal
            title="Còn câu chưa trả lời"
            body={`Bạn còn ${unanswered} câu chưa hoàn thành. Vẫn muốn nộp bài?`}
            primaryLabel="Ở lại làm tiếp"
            primaryAction={() => setSubmitConfirm(false)}
            secondaryLabel="Nộp bài"
            secondaryAction={() => {
              setSubmitConfirm(false);
              handleSubmit();
            }}
          />
        )}
        {successModal && (
          <Modal
            title="Nộp bài thành công!"
            body="Xem kết quả ngay nhé."
            primaryLabel="Xem kết quả"
            primaryAction={() => {
              setSuccessModal(false);
              setView('result');
            }}
          />
        )}
      </div>
    );
  }

  // ── Reading layout ────────────────────────────────────────────────────────
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <TopBar
        onExit={() => setExitModal(true)}
        title={title}
        timeLeft={timeLeft}
      />

      {/* Progress strip */}
      <div
        style={{
          position: 'fixed',
          top: TOPBAR_H,
          left: 0,
          right: 0,
          zIndex: 99,
          height: 3,
          background: '#F3F4F6',
        }}
      >
        <div
          style={{
            width: `${(answered / Math.max(questions.length, 1)) * 100}%`,
            height: '100%',
            background: R,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* FIX #1: SplitPanels now has overflow-y: auto on both sides */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          paddingTop: TOPBAR_H + 3,
          paddingBottom: BAR_H,
        }}
      >
        <SplitPanels
          left={
            <div
              style={{
                background: LIGHT,
                borderRadius: 16,
                padding: '24px',
                minHeight: '100%',
              }}
            >
              {passagePanel}
            </div>
          }
          right={questionsPanel}
        />
      </div>

      <BottomBar
        questions={questions}
        answers={answers}
        onSubmit={() => {
          const un = questions.filter((q) => !answers[q.id]).length;
          if (un > 0) {
            setUnanswered(un);
            setSubmitConfirm(true);
          } else handleSubmit();
        }}
      />

      {exitModal && (
        <Modal
          title="Thoát bài test?"
          body="Tiến độ hiện tại sẽ không được lưu."
          primaryLabel="Tiếp tục làm bài"
          primaryAction={() => setExitModal(false)}
          secondaryLabel="Thoát"
          secondaryAction={() => {
            setExitModal(false);
            goBack();
          }}
        />
      )}
      {submitConfirm && (
        <Modal
          title="Còn câu chưa trả lời"
          body={`Bạn còn ${unanswered} câu chưa hoàn thành. Vẫn muốn nộp bài?`}
          primaryLabel="Ở lại làm tiếp"
          primaryAction={() => setSubmitConfirm(false)}
          secondaryLabel="Nộp bài"
          secondaryAction={() => {
            setSubmitConfirm(false);
            handleSubmit();
          }}
        />
      )}
      {successModal && (
        <Modal
          title="Nộp bài thành công!"
          body="Xem kết quả ngay nhé."
          primaryLabel="Xem kết quả"
          primaryAction={() => {
            setSuccessModal(false);
            setView('result');
          }}
        />
      )}
    </div>
  );
}
