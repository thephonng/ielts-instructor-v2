import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExamQuestionsOrdered } from '../lib/adminExam';
import { bandFromScore, saveExamResult } from '../lib/examResults';

const R     = '#C0392B';
const RL    = '#FEF2F2';
const RB    = '#E8C5C5';
const GRAY  = '#6B7280';
const LIGHT = '#F9FAFB';
const BORDER = '#E5E7EB';
const BAR_H  = 64;

const formatTime = (s) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconCheckSm = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconXSm = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={R}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconChevDown = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color || GRAY}
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconClock = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconHeadphones = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0118 0v6" />
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z" />
    <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
  </svg>
);
const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);
const IconStar = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={R}
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconAlert = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={R}
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconPlay = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={R}>
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const IconPause = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={R}>
    <rect x="5" y="3" width="4" height="18" rx="1" />
    <rect x="15" y="3" width="4" height="18" rx="1" />
  </svg>
);

function Modal({ emoji, title, body, primaryLabel, primaryAction, secondaryLabel, secondaryAction }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px', width: 360,
        textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'popIn 0.2s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}`}</style>
        {emoji && <div style={{ fontSize: 40, marginBottom: 14 }}>{emoji}</div>}
        <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: GRAY, marginBottom: 24, lineHeight: 1.6 }}>{body}</div>
        <button onClick={primaryAction} style={{
          width: '100%', padding: '13px', borderRadius: 10, border: 'none',
          background: R, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 8,
        }}>{primaryLabel}</button>
        {secondaryLabel && (
          <button onClick={secondaryAction} style={{
            width: '100%', padding: '10px', background: 'none', border: 'none',
            color: R, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>{secondaryLabel}</button>
        )}
      </div>
    </div>
  );
}

// ── TopBar: nút Thoát chỉ còn icon <, bỏ chữ "Thoát" ──────────────────────
function TopBar({ onExit, timeLeft, activeTab, listeningCount, readingCount }) {
  const urgent = timeLeft < 120;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: BAR_H, background: '#fff', borderBottom: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center',
      padding: '0 16px',
    }}>
      {/* Left: nút < + logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onExit} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 9, border: `1px solid ${BORDER}`,
          background: '#fff', color: '#374151', cursor: 'pointer',
          transition: 'all 0.15s', padding: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = LIGHT; e.currentTarget.style.borderColor = RB; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = BORDER; }}
        >
          <IconBack />
        </button>
        <img src="/ielts-logo.png" alt="IELTS Instructor" style={{ height: 30, objectFit: 'contain' }} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: 0.2 }}>IELTS</div>
          <div style={{ fontSize: 10, color: GRAY, letterSpacing: 0.3 }}>Instructor</div>
        </div>
      </div>

      {/* Center: tabs — absolute để canh giữa thật sự */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 4, background: LIGHT, borderRadius: 12, padding: 4,
      }}>
        {[
          { key: 'listening', label: 'Listening', count: listeningCount, icon: <IconHeadphones /> },
          { key: 'reading',   label: 'Reading',   count: readingCount,   icon: <IconBook /> },
        ].map(t => (
          <div key={t.key} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9,
            fontSize: 13, fontWeight: 700,
            background: activeTab === t.key ? R : 'transparent',
            color: activeTab === t.key ? '#fff' : '#9CA3AF',
            transition: 'all 0.15s',
          }}>
            {t.icon}
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: activeTab === t.key ? 'rgba(255,255,255,0.25)' : '#fff',
              color: activeTab === t.key ? '#fff' : GRAY,
              borderRadius: 99, padding: '2px 7px',
            }}>{t.count}</span>
          </div>
        ))}
      </div>

      {/* Right: timer — đẩy sang phải bằng marginLeft auto */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px',
        borderRadius: 9, border: `1px solid ${urgent ? RB : BORDER}`,
        background: urgent ? RL : LIGHT, flexShrink: 0,
        animation: urgent ? 'timerPulse 1s infinite' : 'none',
      }}>
        <IconClock color={urgent ? R : GRAY} />
        <span style={{
          fontWeight: 700, fontSize: 15,
          color: urgent ? R : '#374151',
          fontVariantNumeric: 'tabular-nums',
        }}>{formatTime(timeLeft)}</span>
      </div>
      <style>{`@keyframes timerPulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
    </div>
  );
}

function AudioPlayer({ url, questionKey }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setElapsed(0);
    setDuration(0);
  }, [questionKey]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(p => !p);
  };
  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (audioRef.current && duration) {
      audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    }
  };

  return (
    <div style={{
      background: RL, border: `1.5px solid ${RB}`, borderRadius: 14,
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
    }}>
      <audio
        ref={audioRef} src={url}
        onTimeUpdate={e => {
          setElapsed(e.target.currentTime);
          setProgress(e.target.duration ? (e.target.currentTime / e.target.duration) * 100 : 0);
        }}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />
      <button onClick={toggle} style={{
        background: '#fff', border: `1.5px solid ${RB}`, borderRadius: '50%',
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, transition: 'transform 0.12s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {playing ? <IconPause /> : <IconPlay />}
      </button>
      <span style={{ fontSize: 13, fontWeight: 700, color: R, fontVariantNumeric: 'tabular-nums', minWidth: 36 }}>
        {formatTime(Math.floor(elapsed))}
      </span>
      <div onClick={seek} style={{
        flex: 1, height: 5, background: '#fff', border: `1px solid ${RB}`,
        borderRadius: 99, cursor: 'pointer', position: 'relative',
      }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: `linear-gradient(90deg, ${R} 0%, #E05C4E 100%)`,
          borderRadius: 99, transition: 'width 0.1s linear',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: R, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
        {formatTime(Math.floor(duration))}
      </span>
    </div>
  );
}

// ── QuestionCard: câu hỏi nhỏ hơn (16px), số câu nhỏ hơn ───────────────────
function QuestionCard({ q, index, total, answer, onAnswer }) {
  const type = q.question_type;

  let options = [];
  try {
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      options = Object.entries(q.options).map(([k, v]) => ({ key: k, label: v }));
    } else if (Array.isArray(q.options)) {
      options = q.options.map((v, i) => ({ key: String.fromCharCode(65 + i), label: v }));
    }
  } catch { options = []; }

  const pillStyle = (sel) => ({
    padding: '9px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    border: `1.5px solid ${sel ? R : BORDER}`,
    background: sel ? RL : '#fff',
    color: sel ? R : '#374151',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, marginBottom: 6, letterSpacing: 0.5 }}>
          Câu {index} / {total}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1.5 }}>
          {q.question_text}
        </div>
      </div>

      {q.audio_url && <AudioPlayer url={q.audio_url} questionKey={q.id} />}

      {type === 'true_false' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['True', 'False', 'Not Given'].map(o => (
            <button key={o} onClick={() => onAnswer(o)} style={pillStyle(answer === o)}>{o}</button>
          ))}
        </div>
      )}

      {type === 'yes_no' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Yes', 'No', 'Not Given'].map(o => (
            <button key={o} onClick={() => onAnswer(o)} style={pillStyle(answer === o)}>{o}</button>
          ))}
        </div>
      )}

      {type === 'mcq_single' && options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map(({ key, label }) => {
            const sel = answer === key;
            return (
              <button key={key} onClick={() => onAnswer(key)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 12,
                border: `1.5px solid ${sel ? R : BORDER}`,
                background: sel ? RL : '#fff',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontSize: 15,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  fontSize: 13, fontWeight: 700,
                  background: sel ? R : '#F3F4F6',
                  color: sel ? '#fff' : GRAY,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{key}</div>
                <span style={{ fontWeight: sel ? 700 : 500, color: sel ? R : '#374151' }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {(type === 'gap_filling' || !['true_false', 'yes_no', 'mcq_single', 'mcq_multi'].includes(type)) && (
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Nhập câu trả lời..."
          style={{
            width: '100%', border: `1.5px solid ${answer ? R : BORDER}`,
            borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 500,
            outline: 'none', background: answer ? RL : '#fff', color: '#374151',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
}

// ── NavBar: 3 cột — trống | Bỏ qua + Câu sau (giữa) | trống ────────────────
function NavBar({ onSkip, hasAnswer, onNext, onPrev, hasPrev, isLastQuestion, onSubmit }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      height: BAR_H, background: '#fff', borderTop: `1px solid ${BORDER}`,
      display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', padding: '0 24px',
    }}>
      <div />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Câu trước */}
        <button onClick={onPrev} disabled={!hasPrev} style={{
          background: 'none',
          border: `1.5px solid ${hasPrev ? RB : BORDER}`,
          color: hasPrev ? R : '#D1D5DB',
          fontWeight: 700, fontSize: 14, cursor: hasPrev ? 'pointer' : 'not-allowed',
          padding: '10px 20px', borderRadius: 10, transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
          onMouseEnter={e => { if (hasPrev) e.currentTarget.style.background = RL }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          ← Câu trước
        </button>

        {/* Bỏ qua */}
        <button onClick={onSkip} style={{
          background: 'none', border: `1.5px solid ${RB}`, color: R, fontWeight: 700,
          fontSize: 14, cursor: 'pointer', padding: '10px 20px',
          borderRadius: 10, transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = RL}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          Bỏ qua
        </button>

        {/* Câu sau / Nộp bài */}
        {isLastQuestion ? (
          <button onClick={onSubmit} style={{
            padding: '11px 28px', borderRadius: 10, border: 'none',
            background: R, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: `0 3px 12px rgba(192,57,43,0.25)`,
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Nộp bài
          </button>
        ) : (
          <button onClick={onNext} disabled={!hasAnswer} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 28px', borderRadius: 10, border: 'none',
            background: hasAnswer ? R : '#E5E7EB',
            color: hasAnswer ? '#fff' : '#9CA3AF',
            fontSize: 14, fontWeight: 700,
            cursor: hasAnswer ? 'pointer' : 'not-allowed',
            boxShadow: hasAnswer ? `0 3px 12px rgba(192,57,43,0.25)` : 'none',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { if (hasAnswer) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { if (hasAnswer) e.currentTarget.style.opacity = '1'; }}
          >
            Câu sau →
          </button>
        )}
      </div>

      <div />
    </div>
  );
}

function ResultScreen({ result, onContinue, onReview }) {
  const listeningPct = result.listeningTotal ? Math.round((result.listeningScore / result.listeningTotal) * 100) : 0;
  const readingPct = result.readingTotal ? Math.round((result.readingScore / result.readingTotal) * 100) : 0;

  return (
    <div style={{
      minHeight: '100vh', background: LIGHT,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 16px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '40px 32px',
          border: `1px solid ${BORDER}`, marginBottom: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: RL,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <IconStar />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Band IELTS ước tính
          </div>
          <div style={{ fontSize: 80, fontWeight: 900, color: R, lineHeight: 1, marginBottom: 4 }}>
            {result.estimatedBand}
          </div>
          <div style={{ fontSize: 13, color: GRAY, fontWeight: 500 }}>± 0.5 band</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Listening', score: result.listeningScore, total: result.listeningTotal, pct: listeningPct, icon: <IconHeadphones /> },
            { label: 'Reading',   score: result.readingScore,   total: result.readingTotal,   pct: readingPct,   icon: <IconBook /> },
          ].map(({ label, score, total: t, pct: p, icon }) => (
            <div key={label} style={{
              background: '#fff', borderRadius: 16, padding: '20px 18px',
              border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: R, marginBottom: 12 }}>
                {icon}
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#111', lineHeight: 1, marginBottom: 10 }}>
                {score}<span style={{ fontSize: 15, color: GRAY, fontWeight: 500 }}>/{t}</span>
              </div>
              <div style={{ background: BORDER, borderRadius: 99, height: 4 }}>
                <div style={{
                  width: `${p}%`, height: '100%',
                  background: `linear-gradient(90deg, ${R} 0%, #E05C4E 100%)`,
                  borderRadius: 99, transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ fontSize: 12, color: GRAY, marginTop: 6, fontWeight: 600 }}>{p}% chính xác</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onContinue} style={{
            width: '100%', padding: '16px 0', borderRadius: 12, border: 'none',
            background: R, color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: `0 4px 16px rgba(192,57,43,0.3)`,
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Bắt đầu học
          </button>

          <button onClick={onReview} style={{
            width: '100%', padding: '15px 0', borderRadius: 12,
            border: `1.5px solid ${RB}`, background: '#fff', color: R,
            fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = RL}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Xem lại đáp án
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resizable split panels (reuse pattern from ExerciseView) ──────────────
function ReviewSplitPanels({ left, right }) {
  const [split, setSplit] = useState(50);
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
    setSplit(Math.min(72, Math.max(28, ((e.clientX - rect.left) / rect.width) * 100)));
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
    <div ref={ref} style={{ display: 'flex', width: '100%' }}>
      <div style={{ width: `${split}%`, flexShrink: 0 }}>{left}</div>
      <div
        onMouseDown={onMD}
        style={{
          width: 5, flexShrink: 0, background: BORDER, cursor: 'col-resize',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s', alignSelf: 'stretch',
        }}
        onMouseEnter={e => e.currentTarget.style.background = RB}
        onMouseLeave={e => e.currentTarget.style.background = BORDER}
      >
        <div style={{ width: 2, height: 40, background: '#D1D5DB', borderRadius: 99 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{right}</div>
    </div>
  );
}

// ── One question row with answer comparison + explanation ─────────────────
function ReviewQuestionRow({ q, index, answers }) {
  const [open, setOpen] = useState(false);

  let options = [];
  try {
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
      options = Object.entries(q.options).map(([k, v]) => ({ key: k, label: v }));
    } else if (Array.isArray(q.options)) {
      options = q.options.map((v, i) => ({ key: String.fromCharCode(65 + i), label: v }));
    }
  } catch { options = []; }

  const ua = (answers[q.id] ?? '').toString().trim();
  const ca = (q.correct_answer ?? '').toString().trim();
  const ok = ua.toLowerCase() === ca.toLowerCase() && ua !== '';

  const displayUA = options.length
    ? (options.find(o => o.key === ua)?.label ? `${ua}. ${options.find(o => o.key === ua).label}` : (ua || '(chưa trả lời)'))
    : (ua || '(chưa trả lời)');
  const displayCA = options.length
    ? (options.find(o => o.key === ca)?.label ? `${ca}. ${options.find(o => o.key === ca).label}` : ca)
    : ca;

  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: `1.5px solid ${ok ? '#BBF7D0' : '#FECACA'}`,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: ok ? '#22C55E' : R, color: '#fff',
            fontWeight: 800, fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{index}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.55, marginBottom: 10 }}>
              {q.question_text}
            </div>
            {q.question_vi && (
              <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 10, marginTop: -4 }}>
                {q.question_vi}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                borderRadius: 7, background: ok ? '#F0FDF4' : '#FFF5F5',
                border: `1px solid ${ok ? '#BBF7D0' : '#FECACA'}`,
              }}>
                {ok ? <IconCheckSm /> : <IconXSm />}
                <span style={{ fontSize: 13, fontWeight: 700, color: ok ? '#16A34A' : R }}>
                  {displayUA}
                </span>
              </div>

              {!ok && (
                <>
                  <IconArrowRight />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                    borderRadius: 7, background: '#F0FDF4', border: '1px solid #BBF7D0',
                  }}>
                    <IconCheckSm />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>
                      {displayCA}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {q.explanation && (
            <button onClick={() => setOpen(o => !o)} style={{
              flexShrink: 0, padding: '6px 10px', borderRadius: 8,
              border: `1px solid ${BORDER}`, background: open ? '#EFF6FF' : '#fff',
              color: open ? '#1D4ED8' : GRAY, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.15s',
            }}>
              Giải thích
              <span style={{ display: 'flex', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <IconChevDown color={open ? '#1D4ED8' : GRAY} />
              </span>
            </button>
          )}
        </div>
      </div>

      {q.explanation && open && (
        <div style={{ borderTop: '1px solid #EFF6FF', background: '#F8FAFF', padding: '12px 16px 12px 54px' }}>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, fontStyle: 'italic' }}>
            {q.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Audio player (simple, reused for review) ──────────────────────────────
function ReviewAudioPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(p => !p);
  };
  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (audioRef.current && duration) {
      audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
    }
  };

  return (
    <div style={{
      background: RL, border: `1.5px solid ${RB}`, borderRadius: 14,
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
    }}>
      <audio
        ref={audioRef} src={url}
        onTimeUpdate={e => {
          setElapsed(e.target.currentTime);
          setProgress(e.target.duration ? (e.target.currentTime / e.target.duration) * 100 : 0);
        }}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />
      <button onClick={toggle} style={{
        background: '#fff', border: `1.5px solid ${RB}`, borderRadius: '50%',
        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}>
        {playing ? <IconPause /> : <IconPlay />}
      </button>
      <span style={{ fontSize: 12, fontWeight: 700, color: R, fontVariantNumeric: 'tabular-nums', minWidth: 32 }}>
        {formatTime(Math.floor(elapsed))}
      </span>
      <div onClick={seek} style={{
        flex: 1, height: 5, background: '#fff', border: `1px solid ${RB}`,
        borderRadius: 99, cursor: 'pointer', position: 'relative',
      }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: `linear-gradient(90deg, ${R} 0%, #E05C4E 100%)`,
          borderRadius: 99, transition: 'width 0.1s linear',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: R, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
        {formatTime(Math.floor(duration))}
      </span>
    </div>
  );
}

// ── Main review screen ──────────────────────────────────────────────────────
function ExamReviewScreen({ questions, answers, result, onBack }) {
  const [tab, setTab] = useState('listening');

  const listeningQs = questions.filter(q => q.skill === 'listening');
  const readingQs   = questions.filter(q => q.skill === 'reading');
  const activeQs    = tab === 'listening' ? listeningQs : readingQs;

  // Group consecutive questions that share the same passage_text (or audio_url)
  const groups = [];
  activeQs.forEach(q => {
    const groupKey = (q.passage_text && q.passage_text.trim())
      ? `passage:${q.passage_title || ''}::${q.passage_text}`
      : (q.audio_url ? `audio:${q.audio_url}` : null);

    const last = groups[groups.length - 1];
    if (last && last.key === groupKey && groupKey !== null) {
      last.items.push(q);
    } else {
      groups.push({ key: groupKey, items: [q] });
    }
  });

  const score   = tab === 'listening' ? result.listeningScore : result.readingScore;
  const total   = tab === 'listening' ? result.listeningTotal : result.readingTotal;

  return (
    <div style={{
      minHeight: '100vh', background: LIGHT,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: BAR_H, background: '#fff', borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 9, border: `1px solid ${BORDER}`,
          background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = LIGHT; e.currentTarget.style.borderColor = RB; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = BORDER; }}
        >
          <IconBack /> Quay lại
        </button>

        <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#111' }}>
          Xem lại đáp án
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: LIGHT, borderRadius: 12, padding: 4 }}>
          {[
            { key: 'listening', label: 'Listening', icon: <IconHeadphones />, total: result.listeningTotal },
            { key: 'reading',   label: 'Reading',   icon: <IconBook />,       total: result.readingTotal },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9, border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: tab === t.key ? R : 'transparent',
              color: tab === t.key ? '#fff' : '#9CA3AF',
              transition: 'all 0.15s',
            }}>
              {t.icon}{t.label}
              <span style={{
                fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 7px',
                background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#fff',
                color: tab === t.key ? '#fff' : GRAY,
              }}>{t.total}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Score summary */}
      <div style={{ padding: '16px 20px 0', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14,
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
            {tab === 'listening' ? 'Listening' : 'Reading'}:
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#16A34A' }}>{score}</span>
          <span style={{ fontSize: 14, color: GRAY, fontWeight: 600 }}>/ {total} câu đúng</span>
        </div>
      </div>

      {/* Groups */}
      <div style={{ padding: '0 20px 40px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map((g, gi) => {
          const first = g.items[0];
          const hasPassage = first.passage_text && first.passage_text.trim();
          const hasAudio = first.audio_url;

          // Compute running index across the whole tab for numbering
          const startIndex = groups.slice(0, gi).reduce((sum, gr) => sum + gr.items.length, 0) + 1;

          const questionsCol = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {g.items.map((q, qi) => (
                <ReviewQuestionRow key={q.id} q={q} index={startIndex + qi} answers={answers} />
              ))}
            </div>
          );

          if (hasPassage) {
            return (
              <div key={gi} style={{
                background: '#fff', borderRadius: 16, border: `1.5px solid ${BORDER}`,
                overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <ReviewSplitPanels
                  left={
                    <div style={{ padding: '24px', borderRight: `1.5px solid ${BORDER}`, height: '100%', boxSizing: 'border-box' }}>
                      {first.passage_title && (
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 14, marginTop: 0 }}>
                          {first.passage_title}
                        </h2>
                      )}
                      {first.passage_text.split('\n\n').filter(Boolean).map((p, i) => (
                        <p key={i} style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, marginBottom: 14, marginTop: 0 }}>
                          {p}
                        </p>
                      ))}
                    </div>
                  }
                  right={<div style={{ padding: '24px' }}>{questionsCol}</div>}
                />
              </div>
            );
          }

          return (
            <div key={gi} style={{
              background: '#fff', borderRadius: 16, border: `1.5px solid ${BORDER}`,
              padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              {hasAudio && <ReviewAudioPlayer url={first.audio_url} />}
              {questionsCol}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #7F1D1D 0%, #B91C1C 50%, #EF4444 100%)',
      gap: 20,
    }}>
      <img src="/ielts-logo.png" alt="IELTS Instructor"
        style={{ height: 56, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      <div style={{ display: 'flex', gap: 7 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.7)',
            animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function IntroScreen({ onDone }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) { onDone(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #7F1D1D 0%, #B91C1C 50%, #EF4444 100%)',
      gap: 24, fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <img src="/ielts-logo.png" alt="IELTS Instructor"
        style={{ height: 56, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
        Bài test sẽ bắt đầu trong
      </div>
      <div style={{ fontSize: 96, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
        {count > 0 ? count : ''}
      </div>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div style={{
      minHeight: '100vh', background: LIGHT,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 16px',
      fontFamily: "'Segoe UI', system-ui, sans-serif", textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18, background: RL,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        <IconAlert />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>
        Không thể tải bài thi
      </div>
      <div style={{ fontSize: 14, color: GRAY, marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>
        {message || 'Có lỗi xảy ra khi tải câu hỏi. Vui lòng kiểm tra dữ liệu câu hỏi trong admin panel.'}
      </div>
      <button onClick={onBack} style={{
        padding: '12px 28px', borderRadius: 10, border: 'none',
        background: R, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
      }}>Quay lại</button>
    </div>
  );
}

function EmptyScreen({ onBack }) {
  return (
    <div style={{
      minHeight: '100vh', background: LIGHT,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 16px',
      fontFamily: "'Segoe UI', system-ui, sans-serif", textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 8 }}>
        Chưa có câu hỏi
      </div>
      <div style={{ fontSize: 14, color: GRAY, marginBottom: 24 }}>
        Bài thi đầu vào chưa có câu hỏi nào. Vui lòng thêm câu hỏi trong admin panel.
      </div>
      <button onClick={onBack} style={{
        padding: '12px 28px', borderRadius: 10, border: 'none',
        background: R, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
      }}>Quay lại</button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EntranceExam({ user }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [exitModal, setExitModal] = useState(false);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [unanswered, setUnanswered] = useState(0);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);

  const timerRef = useRef(null);
  const submitRef = useRef(null);
  submitRef.current = handleSubmit;

  useEffect(() => {
    let mounted = true;
    getExamQuestionsOrdered()
      .then(qs => {
        if (!mounted) return;
        const safe = Array.isArray(qs) ? qs.filter(q => q && q.id) : [];
        const ordered = [
          ...safe.filter(q => q.skill === 'listening'),
          ...safe.filter(q => q.skill === 'reading'),
        ];
        setQuestions(ordered);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load exam questions:', err);
        if (!mounted) return;
        setLoadError(err?.message || 'Unknown error');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (loading || submitted || loadError || !started) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submitRef.current(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, submitted, loadError, started]);

  async function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
  
    const isCorrect = (q) => {
      const ua = (answers[q.id] ?? '').toString().trim().toLowerCase();
      const ca = (q.correct_answer ?? '').toString().trim().toLowerCase();
      return ua !== '' && ua === ca;
    };
  
    const listeningQs = questions.filter(q => q.skill === 'listening');
    const readingQs   = questions.filter(q => q.skill === 'reading');
    const listeningScore = listeningQs.filter(isCorrect).length;
    const readingScore   = readingQs.filter(isCorrect).length;
    const totalScore     = listeningScore + readingScore;
    const estimatedBand  = bandFromScore(totalScore);
  
    try {
      await saveExamResult({ userId: user.id, listeningScore, readingScore, totalScore, estimatedBand });
    } catch (err) {
      console.error('Failed to save exam result:', err);
    }
  
    setResult({
      listeningScore, readingScore, totalScore, estimatedBand,
      listeningTotal: listeningQs.length, readingTotal: readingQs.length,
    });
}

  if (loading) return <LoadingScreen />;
  if (loadError) return <ErrorScreen message={loadError} onBack={() => navigate('/dashboard')} />;
  if (questions.length === 0) return <EmptyScreen onBack={() => navigate('/dashboard')} />;
  if (!started) return <IntroScreen onDone={() => setStarted(true)} />;
  if (result && reviewMode) {
    return (
      <ExamReviewScreen
        questions={questions}
        answers={answers}
        result={result}
        onBack={() => setReviewMode(false)}
      />
    );
  }
  if (result) return (
    <ResultScreen
      result={result}
      onContinue={() => navigate('/dashboard')}
      onReview={() => setReviewMode(true)}
    />
  );

  const listeningQuestions = questions.filter(q => q.skill === 'listening');
  const readingQuestions   = questions.filter(q => q.skill === 'reading');
  const currentQuestion    = questions[currentIndex];
  const activeTab          = currentQuestion.skill;
  const sectionList        = activeTab === 'listening' ? listeningQuestions : readingQuestions;
  const indexInSection     = sectionList.findIndex(q => q.id === currentQuestion.id) + 1;
  const isLastQuestion     = currentIndex === questions.length - 1;
  const hasAnswer          = !!answers[currentQuestion.id];

  const goNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(i => i + 1);
  };

  const handleTrySubmit = () => {
    const un = questions.filter(q => !answers[q.id]).length;
    if (un > 0) { setUnanswered(un); setSubmitConfirm(true); }
    else handleSubmit();
  };

  const passageSource = activeTab === 'reading' && currentQuestion.passage_text ? currentQuestion : null;

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: LIGHT, fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <TopBar
        onExit={() => setExitModal(true)}
        timeLeft={timeLeft}
        activeTab={activeTab}
        listeningCount={listeningQuestions.length}
        readingCount={readingQuestions.length}
      />

      {/* Progress strip */}
      <div style={{
        position: 'fixed', top: BAR_H, left: 0, right: 0, zIndex: 99,
        height: 3, background: '#F3F4F6',
      }}>
        <div style={{
          width: `${((currentIndex + 1) / questions.length) * 100}%`,
          height: '100%', background: R, transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflowY: 'auto',
        paddingTop: BAR_H + 3,
        paddingBottom: BAR_H,
      }}>
        {/* ── Responsive wrapper: gần full width, padding nhỏ trên mobile ── */}
        <div style={{
          maxWidth: 860, margin: '0 auto',
          padding: 'clamp(16px, 3vw, 32px) clamp(12px, 3vw, 24px)',
        }}>
          {/* ── 1 rectangle chứa cả passage + question ── */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            border: `1.5px solid ${BORDER}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}>
            {/* Passage (nếu có) — chữ to hơn */}
            {passageSource && passageSource.passage_text && (
              <div style={{
                padding: 'clamp(20px, 3vw, 32px)',
                borderBottom: `1.5px solid ${BORDER}`,
                background: LIGHT,
              }}>
                {passageSource.passage_title && (
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 16, marginTop: 0 }}>
                    {passageSource.passage_title}
                  </h2>
                )}
                {passageSource.passage_text
                  .split('\n\n')
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i} style={{ fontSize: 17, color: '#374151', lineHeight: 1.9, marginBottom: 14, marginTop: 0 }}>
                      {p}
                    </p>
                  ))}
              </div>
            )}

            {/* Question card — không có border riêng nữa */}
            <div style={{ padding: 'clamp(20px, 3vw, 32px)' }}>
              <QuestionCard
                key={currentQuestion.id}
                q={currentQuestion}
                index={indexInSection}
                total={sectionList.length}
                answer={answers[currentQuestion.id]}
                onAnswer={opt => setAnswers(a => ({ ...a, [currentQuestion.id]: opt }))}
              />
            </div>
          </div>
        </div>
      </div>

      <NavBar
        onSkip={isLastQuestion ? handleTrySubmit : goNext}
        hasAnswer={hasAnswer}
        onNext={goNext}
        onPrev={() => setCurrentIndex(i => i - 1)}
        hasPrev={currentIndex > 0}
        isLastQuestion={isLastQuestion}
        onSubmit={handleTrySubmit}
      />

      {exitModal && (
        <Modal
          title="Thoát bài thi?"
          body="Tiến độ hiện tại sẽ không được lưu nếu bạn thoát."
          primaryLabel="Tiếp tục làm bài"
          primaryAction={() => setExitModal(false)}
          secondaryLabel="Thoát"
          secondaryAction={() => { setExitModal(false); navigate('/dashboard'); }}
        />
      )}
      {submitConfirm && (
        <Modal
          title="Còn câu chưa trả lời"
          body={`Bạn còn ${unanswered} câu chưa hoàn thành. Vẫn muốn nộp bài?`}
          primaryLabel="Ở lại làm tiếp"
          primaryAction={() => setSubmitConfirm(false)}
          secondaryLabel="Nộp bài"
          secondaryAction={() => { setSubmitConfirm(false); handleSubmit(); }}
        />
      )}
    </div>
  );
}
