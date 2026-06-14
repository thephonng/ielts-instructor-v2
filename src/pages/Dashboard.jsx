import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStreak } from '../hooks/useStreak'
import { getTopicProgress } from '../lib/passages'
import { getWritingProgress } from '../lib/writing'
import { getLatestExamResult } from '../lib/examResults'
import { getExerciseCountBySkill } from '../lib/exerciseResults'
import { supabase } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const RED       = '#B91C1C'
const RED_MID   = '#DC2626'
const RED_LIGHT = '#FEF2F2'
const RED_DARK  = '#7F1D1D'
const RED_BORDER= '#FECACA'
const TEXT      = '#111827'
const TEXT_MID  = '#374151'
const TEXT_MUTE = '#9CA3AF'
const WHITE     = '#FFFFFF'
const BORDER    = '#F3F4F6'
const BORDER_MID= '#E5E7EB'

function fmtMinutes(min) {
  if (!min || min === 0) return '0 phút'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} phút`
  if (m === 0) return `${h}h`
  return `${h}h ${m}p`
}

const IconUnlock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
)
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IconFlame = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
  </svg>
)
const IconWriting = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
)
const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
)
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6"/>
  </svg>
)
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

function ProgressRing({ pct = 0, size = 72, stroke = 7, children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct / 100, 1)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}/>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444"/><stop offset="100%" stopColor="#7F1D1D"/>
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        {children}
      </div>
    </div>
  )
}

function ProgressBar({ pct, h = 8 }) {
  return (
    <div style={{ background: BORDER, borderRadius: 99, height: h, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${RED} 0%, ${RED_MID} 100%)`, borderRadius: 99, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)' }}/>
    </div>
  )
}

function StatCard({ icon, label, value, sub, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{
        background: WHITE, border: `1.5px solid ${hov ? RED_BORDER : BORDER_MID}`,
        borderRadius: 16, padding: '20px 18px',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? `0 8px 24px rgba(185,28,28,0.12)` : '0 1px 4px rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: hov ? RED_LIGHT : BORDER,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: RED, transition: 'background 0.2s',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: TEXT_MUTE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: TEXT, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#22C55E', marginTop: 4, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  )
}

function SectionHeader({ title, sub, action, onAction }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 18, color: TEXT, letterSpacing: -0.3 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: TEXT_MUTE, marginTop: 3 }}>{sub}</div>}
      </div>
      {action && (
        <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onAction}
          style={{
            fontSize: 13, fontWeight: 700,
            color: hov ? WHITE : RED,
            background: hov ? RED : RED_LIGHT,
            border: 'none', borderRadius: 10,
            padding: '8px 16px', cursor: 'pointer',
            transition: 'all 0.18s ease',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {action} <IconChevronRight />
        </button>
      )}
    </div>
  )
}

function UpgradeBanner({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{
        border: `1.5px solid ${RED}`,
        background: hov ? RED_LIGHT : WHITE,
        borderRadius: 14, padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? `0 8px 28px rgba(185,28,28,0.22), 0 0 0 3px rgba(185,28,28,0.08)` : `0 2px 8px rgba(185,28,28,0.10)`,
        gap: 16, flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: RED, flexShrink: 0 }}><IconUnlock /></div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: RED }}>Mở khóa toàn bộ nội dung</div>
          <div style={{ fontSize: 13, color: TEXT_MUTE, marginTop: 2 }}>
            Toàn bộ bài đọc · Trợ lý AI · Sample Writing Band cao
            <span style={{ textDecoration: 'line-through', marginLeft: 10, marginRight: 6 }}>299.000₫</span>
            <strong style={{ color: RED }}>99.000₫</strong>
            <span style={{ color: TEXT_MUTE }}>/tháng</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: RED, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        Xem gói <IconChevronRight />
      </div>
    </div>
  )
}

function IELTSLevelCard({ examResult, targetBand }) {
  const navigate = useNavigate()
  const entryBand = examResult?.estimated_band ?? null
  const targetVal = targetBand || null
  const hasEntry  = entryBand !== null
  const hasTarget = targetVal !== null

  return (
    <div style={{ background: WHITE, borderRadius: 16, border: `1.5px solid ${BORDER_MID}`, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ position: 'relative', padding: '18px 20px 14px', background: `linear-gradient(135deg, ${RED_DARK} 0%, ${RED} 60%, #EF4444 100%)`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none', backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: '14px 14px' }}/>
        <div style={{ position: 'absolute', top: -20, right: 10, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
        <div style={{ position: 'relative', zIndex: 1, fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Your IELTS Level
        </div>
      </div>
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: hasEntry ? `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)` : WHITE, border: `2.5px solid ${hasEntry ? RED : BORDER_MID}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hasEntry ? `0 0 0 4px rgba(185,28,28,0.12)` : 'none', transition: 'all 0.3s' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: hasEntry ? WHITE : BORDER_MID }}/>
            </div>
            <div style={{ fontSize: 10, color: hasEntry ? RED : TEXT_MUTE, fontWeight: 700, textAlign: 'center' }}>Entry</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: hasEntry ? RED : TEXT_MUTE, lineHeight: 1, minHeight: 18 }}>{hasEntry ? `Band ${entryBand}` : '—'}</div>
          </div>
          <div style={{ flex: 1, marginTop: 16, padding: '0 4px' }}>
            <svg viewBox="0 0 120 20" preserveAspectRatio="none" style={{ width: '100%', height: 20, display: 'block' }}>
              <path d="M4,10 Q30,3 60,10 Q90,17 116,10" fill="none" stroke="#F3F4F6" strokeWidth="3" strokeLinecap="round"/>
              <path d="M4,10 Q30,3 60,10 Q90,17 116,10" fill="none" stroke={hasEntry ? `url(#journeyGrad)` : '#F3F4F6'} strokeWidth="3" strokeLinecap="round" strokeDasharray="200" strokeDashoffset={hasEntry && hasTarget ? 0 : hasEntry ? 100 : 200} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}/>
              <defs>
                <linearGradient id="journeyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={RED}/><stop offset="100%" stopColor="#EF4444"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: hasTarget ? RED_LIGHT : WHITE, border: `2.5px solid ${hasTarget ? RED : BORDER_MID}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hasTarget ? `0 0 0 4px rgba(185,28,28,0.10)` : 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={hasTarget ? RED : BORDER_MID} stroke={hasTarget ? RED : BORDER_MID} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </div>
            <div style={{ fontSize: 10, color: hasTarget ? RED : TEXT_MUTE, fontWeight: 700, textAlign: 'center' }}>Target</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: hasTarget ? RED : TEXT_MUTE, lineHeight: 1, minHeight: 18 }}>{hasTarget ? `Band ${targetVal}` : '—'}</div>
          </div>
        </div>
        {!hasEntry && (
          <button onClick={() => navigate('/entrance-exam')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 14, padding: '9px 0', borderRadius: 10, border: `1.5px dashed ${BORDER_MID}`, background: 'transparent', cursor: 'pointer', transition: 'all 0.18s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.background = RED_LIGHT }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_MID; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>Làm bài kiểm tra đầu vào</span>
          </button>
        )}
      </div>
    </div>
  )
}

function LearningSummaryCard({ totalHours, streak, totalReading, lastWritingBand }) {
  const rows = [
    { icon: <IconClock />,   label: 'Tổng thời lượng', value: `${totalHours} giờ`, color: '#2563EB' },
    { icon: <IconFlame />,   label: 'Streak hiện tại',  value: `${streak} ngày`,   color: RED },
    { icon: <IconBook />,    label: 'Bài đọc đã làm',   value: totalReading,        color: '#059669' },
    { icon: <IconWriting />, label: 'Band Writing',      value: lastWritingBand || '—', color: '#D97706' },
  ]
  return (
    <div style={{ background: WHITE, borderRadius: 16, border: `1.5px solid ${BORDER_MID}`, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ padding: '14px 18px 0', fontWeight: 800, fontSize: 14, color: TEXT, letterSpacing: -0.2 }}>Learning summary</div>
      <div style={{ padding: '10px 0 6px' }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `${r.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color }}>{r.icon}</div>
            <span style={{ flex: 1, fontSize: 13, color: TEXT_MID }}>{r.label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LearningProfileSidebar({ profile, user, streak, minutesToday, streakLit, progress, readingData, writingData, examResult, totalHours, skillCounts }) {
  const navigate = useNavigate()
  const lastBand = writingData[writingData.length - 1]?.score
  const totalReading = skillCounts?.reading ?? 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>Learning Profile</span>
        <button onClick={() => navigate('/profile')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          style={{ fontSize: 13, fontWeight: 700, color: RED, background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.3s' }}>
          Xem tất cả
        </button>
      </div>
      <IELTSLevelCard examResult={examResult} targetBand={profile?.target_band} />
      <LearningSummaryCard totalHours={totalHours} streak={streak} totalReading={totalReading} lastWritingBand={lastBand ? `Band ${lastBand}` : null} />
      <div style={{ background: WHITE, borderRadius: 18, padding: '20px', border: `1.5px solid ${BORDER_MID}`, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: TEXT, marginBottom: 14, letterSpacing: -0.2 }}>Chuỗi học tập</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProgressRing pct={progress} size={72} stroke={7}>
            <span style={{ fontSize: 18, fontWeight: 900, color: RED, lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: 10, color: TEXT_MUTE, fontWeight: 600 }}>ngày</span>
          </ProgressRing>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: TEXT_MUTE, marginBottom: 7 }}>Hôm nay: <b style={{ color: TEXT }}>{minutesToday}/30 phút</b></div>
            <ProgressBar pct={progress} h={7}/>
            <div style={{ fontSize: 12, color: streakLit ? '#22C55E' : TEXT_MUTE, marginTop: 5, fontWeight: 700 }}>
              {streakLit ? '✓ Hoàn thành hôm nay!' : `Còn ${30 - minutesToday} phút`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TestCard({ ex, index, onClick }) {
  const [hov, setHov] = useState(false)
  const colors = ['#2563EB', '#059669', '#D97706']
  const color = colors[index % colors.length]
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ background: WHITE, border: `1.5px solid ${hov ? color + '55' : BORDER_MID}`, borderRadius: 18, padding: '20px', transition: 'all 0.22s ease', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? `0 12px 32px ${color}22` : '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: hov ? `linear-gradient(90deg, ${color}, ${color}88)` : 'transparent', transition: 'all 0.2s', borderRadius: '18px 18px 0 0' }}/>
      <div style={{ width: 48, height: 48, borderRadius: 13, marginBottom: 14, background: hov ? color : color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: hov ? `0 4px 14px ${color}44` : 'none' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={hov ? '#fff' : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 8, lineHeight: 1.4 }}>{ex.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: TEXT_MUTE }}>{ex.questions?.length || ex.question_count || '?'} câu hỏi</span>
        {ex.is_pro
          ? <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '3px 10px', borderRadius: 20 }}>PRO</span>
          : <span style={{ fontSize: 11, fontWeight: 800, color: '#22C55E', background: '#DCFCE7', padding: '3px 10px', borderRadius: 20 }}>Miễn phí</span>
        }
      </div>
    </div>
  )
}

const MILESTONES = [
  { days: 3,   label: 'Khởi động', reward: 'Khởi đầu' },
  { days: 10,  label: 'Vào guồng', reward: 'Kiên trì' },
  { days: 30,  label: 'Kiên trì',  reward: 'Giữ lửa' },
  { days: 60,  label: 'Tận tâm',   reward: 'Tăng tốc' },
  { days: 100, label: '100 ngày',  reward: '1 tháng free' },
]

function MilestoneCard({ m, done }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'center',
        background: done ? `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)` : hov ? RED_LIGHT : BORDER,
        border: `1.5px solid ${done ? 'transparent' : hov ? RED_BORDER : BORDER_MID}`,
        borderRadius: 16, padding: '16px 10px',
        transition: 'all 0.2s ease',
        boxShadow: done ? '0 6px 18px rgba(185,28,28,0.28)' : hov ? '0 4px 12px rgba(185,28,28,0.1)' : 'none',
        transform: hov && !done ? 'translateY(-3px)' : 'none',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 900, color: done ? WHITE : TEXT_MID, marginBottom: 3 }}>{m.days} ngày</div>
      <div style={{ fontSize: 11, color: done ? 'rgba(255,255,255,0.7)' : TEXT_MUTE, margin: '3px 0 7px' }}>{m.label}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color: done ? RED : TEXT_MUTE, background: done ? WHITE : BORDER_MID, borderRadius: 20, padding: '3px 8px', display: 'inline-block' }}>
        {done ? '✓ Đạt' : m.reward}
      </div>
    </div>
  )
}

export default function Dashboard({ user, profile, isPremium, setPage }) {
  const navigate = useNavigate()
  const { minutesToday, streakLit, progress, minutesLeft, streak } = useStreak(user?.id)
  const [writingData, setWritingData]   = useState([])
  const [readingData, setReadingData]   = useState([])
  const [leaderboard, setLeaderboard]   = useState([])
  const [testExercises, setTestExercises] = useState([])
  const [loading, setLoading]           = useState(true)
  const [examResult, setExamResult]     = useState(undefined)
  const [totalHours, setTotalHours]     = useState(0)
  const [skillCounts, setSkillCounts]   = useState({ reading: 0, listening: 0, writing: 0 })

  const firstName    = profile?.full_name?.split(' ').pop() || 'bạn'
  const nextMilestone = MILESTONES.find(m => m.days > streak)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      getWritingProgress(user.id),
      getTopicProgress(user.id),
      getExerciseCountBySkill(user.id),
    ]).then(([writing, reading, counts]) => {
      setWritingData(writing.map((w, i) => ({ date: `Lần ${i + 1}`, score: w.band_overall })))
      setReadingData(reading)
      setSkillCounts(counts)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    getLatestExamResult(user.id).then(r => setExamResult(r ?? null))
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('study_sessions').select('minutes_studied').eq('user_id', user.id)
      .then(({ data }) => {
        const total = (data || []).reduce((s, r) => s + (r.minutes_studied || 0), 0)
        setTotalHours(Math.round(total / 60 * 10) / 10)
      })
  }, [user?.id])

  useEffect(() => {
    const n = new Date()
    const monthStart = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2,'0')}-01`
    supabase.from('study_sessions').select('user_id, minutes_studied, profiles(id, full_name, avatar_url)').gte('date', monthStart)
      .then(({ data, error }) => {
        if (error || !data) return
        const map = {}
        data.forEach(r => {
          const uid = r.user_id
          if (!map[uid]) map[uid] = { id: uid, name: r.profiles?.full_name || 'Ẩn danh', minutes: 0 }
          map[uid].minutes += r.minutes_studied || 0
        })
        setLeaderboard(Object.values(map).sort((a, b) => b.minutes - a.minutes).slice(0, 5))
      })
  }, [user?.id])

  useEffect(() => {
    supabase.from('passages').select('id, title, question_type, is_pro').eq('status', 'published').order('created_at', { ascending: false }).limit(3)
      .then(({ data, error }) => { if (!error && data) setTestExercises(data) })
  }, [])

  const lastWriting = writingData[writingData.length - 1]?.score || '—'
  const myLbRank    = leaderboard.findIndex(u => u.id === user?.id) + 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .ds { animation: fadeUp 0.35s ease both }
        .ds:nth-child(1){animation-delay:0s} .ds:nth-child(2){animation-delay:0.06s}
        .ds:nth-child(3){animation-delay:0.12s} .ds:nth-child(4){animation-delay:0.18s}
        .ds:nth-child(5){animation-delay:0.24s} .ds:nth-child(6){animation-delay:0.30s}
        .ds:nth-child(7){animation-delay:0.36s}
        @media(max-width:900px){
          .dash-two-col{grid-template-columns:1fr!important} .dash-sidebar{position:static!important}
          .stat-row{grid-template-columns:1fr 1fr!important} .test-grid{grid-template-columns:1fr!important}
          .milestone-row{grid-template-columns:repeat(3,1fr)!important}
        }
        @media(max-width:600px){
          .stat-row{grid-template-columns:1fr!important} .milestone-row{grid-template-columns:repeat(2,1fr)!important}
        }
      `}</style>

      {!isPremium && (
        <div className="ds"><UpgradeBanner onClick={() => navigate('/subscription')} /></div>
      )}

      <div className="dash-two-col" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:22, alignItems:'start' }}>

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* Welcome banner */}
          <div className="ds" style={{ background:`linear-gradient(135deg, ${RED_DARK} 0%, ${RED} 55%, #EF4444 100%)`, borderRadius:22, padding:'30px 32px', position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(185,28,28,0.28)' }}>
            <div style={{ position:'absolute', top:-30, right:80, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
            <div style={{ position:'absolute', bottom:-50, right:-10, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>Tổng quan học tập</div>
              <h1 style={{ fontSize:26, fontWeight:900, color:WHITE, marginBottom:8, letterSpacing:-0.4 }}>Xin chào, {firstName}</h1>
              <p style={{ fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.6 }}>
                {streakLit ? 'Bạn đã hoàn thành mục tiêu hôm nay. Xuất sắc!' : `Còn ${minutesLeft} phút nữa để giữ streak hôm nay.`}
              </p>
              {streakLit && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:7, marginTop:12, background:'rgba(34,197,94,0.22)', border:'1px solid rgba(34,197,94,0.38)', padding:'7px 14px', borderRadius:20 }}>
                  <IconCheck />
                  <span style={{ fontSize:13, fontWeight:700, color:'#4ADE80' }}>Streak hôm nay hoàn thành</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="ds stat-row" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            <StatCard icon={<IconWriting />} label="Band Writing" value={lastWriting} sub={writingData.length > 1 ? `Từ Band ${writingData[0]?.score}` : null}/>
            <StatCard icon={<IconBook />} label="Bài đọc đã làm" value={skillCounts.reading} sub="tổng bài hoàn thành"/>
            <StatCard icon={<IconChart />} label="Xếp hạng tháng" value={myLbRank > 0 ? `#${myLbRank}` : '—'} sub="bảng tháng này" onClick={() => navigate('/leaderboard')}/>
          </div>

          {/* Writing chart */}
          {writingData.length > 1 && (
            <div className="ds" style={{ background:WHITE, borderRadius:20, padding:'22px 24px', border:`1.5px solid ${BORDER_MID}`, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="Tiến độ Band Writing" sub={`${writingData.length} lần nộp`} action="Xem tất cả" onAction={() => navigate('/writing')}/>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={writingData} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F9FAFB"/>
                  <XAxis dataKey="date" tick={{ fontSize:12, fill:TEXT_MUTE }} axisLine={false} tickLine={false}/>
                  <YAxis domain={[4,9]} ticks={[4,5,6,7,8,9]} tick={{ fontSize:12, fill:TEXT_MUTE }} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={v => [`Band ${v}`, 'Điểm']} contentStyle={{ fontSize:13, borderRadius:10, border:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}/>
                  <Line type="monotone" dataKey="score" stroke={RED} strokeWidth={3} dot={{ fill:WHITE, stroke:RED, strokeWidth:3, r:5 }} activeDot={{ fill:RED, r:7, strokeWidth:0 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Reading accuracy */}
          {readingData.length > 0 && (
            <div className="ds" style={{ background:WHITE, borderRadius:20, padding:'22px 24px', border:`1.5px solid ${BORDER_MID}`, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <SectionHeader title="Độ chính xác đọc hiểu theo chủ đề"/>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {readingData.map(t => (
                  <div key={t.topic}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:7 }}>
                      <span style={{ fontWeight:600, color:TEXT_MID }}>{t.topic}</span>
                      <span style={{ fontWeight:800, color:RED }}>{t.avgAccuracy}%</span>
                    </div>
                    <ProgressBar pct={t.avgAccuracy} h={7}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          <div className="ds" style={{ background:WHITE, borderRadius:20, padding:'22px 24px', border:`1.5px solid ${BORDER_MID}`, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <SectionHeader title="Mốc streak của bạn" sub={`Hiện tại: ${streak} ngày`}/>
            <div className="milestone-row" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
              {MILESTONES.map(m => (
                <MilestoneCard key={m.days} m={m} done={streak >= m.days} />
              ))}
            </div>
            {nextMilestone && (
              <div style={{ marginTop:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:TEXT_MUTE, marginBottom:7 }}>
                  <span>Đến mốc <b style={{ color:TEXT_MID }}>{nextMilestone.days} ngày</b></span>
                  <span style={{ fontWeight:800, color:RED }}>{streak}/{nextMilestone.days}</span>
                </div>
                <ProgressBar pct={(streak / nextMilestone.days) * 100} h={8}/>
                <div style={{ fontSize:12, color:TEXT_MUTE, marginTop:7 }}>
                  Còn <b style={{ color:RED }}>{nextMilestone.days - streak} ngày</b> để nhận {nextMilestone.reward}
                </div>
              </div>
            )}
          </div>

          {/* Test Practice */}
          <div className="ds" style={{ background:WHITE, borderRadius:20, padding:'22px 24px', border:`1.5px solid ${BORDER_MID}`, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <SectionHeader title="Test Practice" sub="Luyện tập các dạng câu hỏi IELTS" action="Xem tất cả" onAction={() => navigate('/testpractice')}/>
            {testExercises.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:TEXT_MUTE, fontSize:13 }}>Đang tải bài tập...</div>
            ) : (
              <div className="test-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                {testExercises.map((ex, i) => (
                  <div key={ex.id} style={{ animation:`fadeUp 0.3s ease both`, animationDelay:`${i*0.07}s` }}>
                    <TestCard ex={ex} index={i} onClick={() => navigate('/testpractice')}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="ds" style={{ borderRadius:20, overflow:'hidden', border:`1.5px solid ${BORDER_MID}`, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ background:`linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`, padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:WHITE, fontWeight:800, fontSize:17 }}>Bảng xếp hạng tháng này</span>
                <button onClick={() => navigate('/leaderboard')} style={{ color:'rgba(255,255,255,0.85)', background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.28)', cursor:'pointer', fontSize:13, borderRadius:10, padding:'6px 14px', fontWeight:700, transition:'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.26)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.14)'}
                >Xem tất cả →</button>
              </div>
              {leaderboard.map((u, i) => {
                const isMe = u.id === user?.id
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                return (
                  <div key={u.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 22px', borderBottom: i < leaderboard.length-1 ? `1px solid ${BORDER}` : 'none', background: isMe ? RED_LIGHT : WHITE, transition:'background 0.12s' }}
                    onMouseEnter={e => { if(!isMe) e.currentTarget.style.background='#FAFAFA' }}
                    onMouseLeave={e => { if(!isMe) e.currentTarget.style.background=isMe?RED_LIGHT:WHITE }}
                  >
                    <span style={{ fontWeight:900, fontSize:17, width:30, textAlign:'center', color: i<3?RED:'#D1D5DB', flexShrink:0 }}>{medal || `${i+1}`}</span>
                    <div style={{ width:38, height:38, borderRadius:'50%', background: isMe ? `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)` : BORDER, color: isMe ? WHITE : TEXT_MID, fontWeight:900, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: isMe ? '0 3px 10px rgba(185,28,28,0.32)' : 'none' }}>
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <span style={{ fontSize:14, flex:1, fontWeight: isMe?800:500, color: isMe?RED:TEXT_MID }}>
                      {u.name}
                      {isMe && <span style={{ fontSize:11, background:RED, color:WHITE, borderRadius:10, padding:'2px 8px', marginLeft:6 }}>Bạn</span>}
                    </span>
                    <span style={{ fontSize:14, fontWeight:800, color: isMe?RED:TEXT_MUTE }}>{fmtMinutes(u.minutes)}</span>
                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* RIGHT SIDEBAR */}
        <div className="dash-sidebar" style={{ position:'sticky', top:20 }}>
          <LearningProfileSidebar
            profile={profile} user={user}
            streak={streak} minutesToday={minutesToday}
            streakLit={streakLit} progress={progress}
            readingData={readingData} writingData={writingData}
            examResult={examResult} totalHours={totalHours}
            skillCounts={skillCounts}
          />
        </div>
      </div>
    </div>
  )
}