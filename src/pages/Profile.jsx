import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../lib/auth'
import { getLatestExamResult } from '../lib/examResults'
import { supabase } from '../lib/supabase'

const RED       = '#B91C1C'
const RED_LIGHT = '#FEE2E2'
const RED_PALE  = '#FFF5F5'
const RED_FAINT = '#FEF2F2'
const BORDER    = '#F3E8E8'
const TEXT      = '#111827'
const MUTED     = '#6B7280'
const WHITE     = '#FFFFFF'

const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconFlame = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
  </svg>
)
const IconTrophy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="11"/>
    <path d="M7 4H4v3a5 5 0 005 5h6a5 5 0 005-5V4h-3"/>
    <rect x="7" y="2" width="10" height="4" rx="1"/>
  </svg>
)
const IconStar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IconFlag = ({ size = 16, color = RED }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
)
const IconDot = ({ size = 14, color = RED, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="8" fill={filled ? color : 'none'} stroke={color} strokeWidth="2.5"/>
    {filled && <circle cx="12" cy="12" r="3.5" fill="white"/>}
  </svg>
)

function StatCard({ icon, label, value }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: WHITE,
        border: `1px solid ${hov ? RED_LIGHT : BORDER}`,
        borderRadius: 14, padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all .2s',
        boxShadow: hov ? `0 4px 18px rgba(185,28,28,.11)` : '0 1px 3px rgba(0,0,0,.04)',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: hov ? RED_LIGHT : RED_FAINT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: RED, transition: 'background .2s', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: RED, marginTop: 1, lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}

function PremiumBanner({ onUpgrade, isPremium, planExpiresAt }) {
  const [hov, setHov] = useState(false)
  if (isPremium) {
    return (
      <div style={{
        borderRadius: 14, border: `1.5px solid #86EFAC`,
        background: '#F0FDF4', padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 1px 4px rgba(22,163,74,.08)',
      }}>
        <span style={{ color: '#16A34A' }}><IconStar /></span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Bạn đang là thành viên Premium</span>
        {planExpiresAt && (
          <span style={{ fontSize: 12, color: '#4ADE80', marginLeft: 8 }}>
            · Hết hạn {new Date(planExpiresAt).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>
    )
  }
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onUpgrade}
      style={{
        borderRadius: 14, border: `1.5px solid ${RED}`,
        background: hov ? RED_LIGHT : WHITE,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', transition: 'all .2s',
        boxShadow: hov
          ? `0 6px 24px rgba(185,28,28,.22), 0 0 0 3px rgba(185,28,28,.08)`
          : `0 1px 4px rgba(185,28,28,.1)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: RED }}><IconStar /></span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: RED }}>Nâng cấp Premium</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>
            <span style={{ textDecoration: 'line-through', marginRight: 6 }}>299.000₫</span>
            <strong style={{ color: RED, fontSize: 14 }}>99.000₫</strong>
            <span style={{ color: MUTED }}>/tháng</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: RED, fontSize: 12, fontWeight: 700 }}>
        Xem gói <IconChevron />
      </div>
    </div>
  )
}

const BAND_OPTIONS = ['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5+']
function BandModal({ current, onSave, onClose }) {
  const [sel, setSel] = useState(current || '6.5')
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: WHITE, borderRadius: 22, padding: 32,
        width: 'min(380px, 90vw)', boxShadow: '0 24px 64px rgba(0,0,0,.18)',
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: TEXT, marginBottom: 5 }}>Chọn Band mục tiêu</div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Lộ trình học sẽ được cá nhân hóa theo mục tiêu của bạn.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {BAND_OPTIONS.map(b => (
            <button key={b} onClick={() => setSel(b)} style={{
              padding: '11px 0', borderRadius: 12,
              border: `2px solid ${sel === b ? RED : BORDER}`,
              background: sel === b ? RED_LIGHT : WHITE,
              color: sel === b ? RED : TEXT,
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              transition: 'all .15s',
              transform: sel === b ? 'scale(1.06)' : 'scale(1)',
            }}>{b}</button>
          ))}
        </div>
        <button onClick={() => onSave(sel)} style={{
          width: '100%', padding: '13px 0',
          background: RED, color: WHITE, border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: `0 4px 14px rgba(185,28,28,.3)`,
        }}>Lưu mục tiêu</button>
      </div>
    </div>
  )
}

function JourneyStrip({ examResult, targetBand, onSetGoal }) {
  const navigate = useNavigate()
  const hasEntry = !!examResult
  const hasGoal  = !!targetBand
  const [hov, setHov] = useState(false)
  const [btnHov, setBtnHov] = useState(false)
 
  return (
    <div style={{
      background: 'rgba(255,255,255,.62)', borderRadius: 14,
      padding: '16px 22px', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,.85)',
      display: 'flex', alignItems: 'center', gap: 0,
      flex: '0 0 auto', maxWidth: '100%',
    }}>
      {/* Entry node */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: hasEntry ? RED : WHITE,
          border: `2.5px solid ${hasEntry ? RED : '#D1D5DB'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: hasEntry ? `0 0 0 4px rgba(185,28,28,.12)` : 'none',
        }}>
          {/* inner dot */}
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: hasEntry ? WHITE : '#D1D5DB' }}/>
        </div>
        <div style={{ fontSize: 10, color: hasEntry ? RED : MUTED, fontWeight: hasEntry ? 700 : 400 }}>Đầu vào</div>
        {hasEntry
          ? <div style={{ fontSize: 11, fontWeight: 800, color: RED }}>Band {examResult.estimated_band}</div>
          : <div style={{ fontSize: 11, color: MUTED }}>—</div>
        }
      </div>
 
      {/* Path */}
      <div style={{ flex: 1, margin: '0 10px', marginBottom: 28, minWidth: 60 }}>
        <svg viewBox="0 0 120 12" preserveAspectRatio="none" style={{ width: '100%', height: 12 }}>
          <path d="M0,6 Q15,1 30,6 Q45,11 60,6 Q75,1 90,6 Q105,11 120,6" fill="none" stroke="#E5E7EB" strokeWidth="3"/>
          {hasEntry && (
            <path d="M0,6 Q15,1 30,6 Q45,11 60,6 Q75,1 90,6 Q105,11 120,6"
              fill="none" stroke={RED} strokeWidth="3"
              strokeDasharray="240" strokeDashoffset={hasGoal ? 0 : 120}
              style={{ transition: 'stroke-dashoffset .8s ease' }}/>
          )}
        </svg>
      </div>
 
      {/* Target node */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: hasGoal ? RED_LIGHT : WHITE,
          border: `2.5px solid ${hasGoal ? RED : '#D1D5DB'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: hasGoal ? `0 0 0 4px rgba(185,28,28,.1)` : 'none',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={hasGoal ? RED : '#9CA3AF'} stroke={hasGoal ? RED : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
        </div>
        <div style={{ fontSize: 10, color: hasGoal ? RED : MUTED, fontWeight: hasGoal ? 700 : 400 }}>Mục tiêu</div>
        {hasGoal
          ? <div style={{ fontSize: 11, fontWeight: 800, color: RED }}>Band {targetBand}</div>
          : <div style={{ fontSize: 11, color: MUTED }}>—</div>
        }
      </div>
 
      {/* CTA buttons */}
      <div style={{ marginLeft: 18, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Đổi/Chọn mục tiêu */}
        <button
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          onClick={onSetGoal}
          style={{
            background: RED, color: WHITE, border: 'none', borderRadius: 20,
            padding: '8px 16px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: hov ? `0 6px 16px rgba(185,28,28,.38)` : `0 2px 8px rgba(185,28,28,.22)`,
            transform: hov ? 'translateY(-1px) scale(1.04)' : 'none',
            transition: 'all .16s',
          }}
        >+ {hasGoal ? 'Đổi mục tiêu' : 'Chọn mục tiêu'}</button>
 
        {/* Làm bài đầu vào — chỉ hiện khi chưa có entry */}
        {!hasEntry && (
          <button
            onMouseEnter={() => setBtnHov(true)} onMouseLeave={() => setBtnHov(false)}
            onClick={() => navigate('/entrance-exam')}
            style={{
              
              border: `1.5px dashed ${btnHov ? RED : '#D1D5DB'}`,
              borderRadius: 20, padding: '6px 12px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap', textAlign: 'center',
              transition: 'all .16s',
              background: btnHov ? RED_LIGHT : 'transparent',
            }}
          >Làm bài kiểm tra đầu vào</button>
        )}
      </div>
    </div>
  )
}

function Heatmap({ userId }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    const since = new Date()
    since.setDate(since.getDate() - 16 * 7)
    const sinceStr = since.toLocaleDateString('en-CA')
    supabase
      .from('study_sessions')
      .select('date, minutes_studied')
      .eq('user_id', userId)
      .gte('date', sinceStr)
      .then(({ data, error }) => {
        if (!error && data) setSessions(data)
        setLoading(false)
      })
  }, [userId])

  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [loading])

  const map = {}
  sessions.forEach(s => {
    const key = typeof s.date === 'string' ? s.date.slice(0, 10) : new Date(s.date).toLocaleDateString('en-CA')
    map[key] = (map[key] || 0) + (s.minutes_studied || 0)
  })

  const today = new Date(); today.setHours(0,0,0,0)
  const todayDow = today.getDay()
  const daysSinceMonday = todayDow === 0 ? 6 : todayDow - 1
  const gridStart = new Date(today)
  gridStart.setDate(today.getDate() - daysSinceMonday - 15 * 7)

  const weeks = []
  for (let w = 0; w < 16; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dt = new Date(gridStart)
      dt.setDate(gridStart.getDate() + w * 7 + d)
      const key = dt.toLocaleDateString('en-CA')
      week.push({ date: key, minutes: map[key] || 0, future: dt > today, isToday: dt.getTime() === today.getTime() })
    }
    weeks.push(week)
  }

  const monthLabels = weeks.map((week, wi) => {
    const d = new Date(week[0].date + 'T00:00:00')
    const prev = wi > 0 ? new Date(weeks[wi-1][0].date + 'T00:00:00') : null
    if (!prev || prev.getMonth() !== d.getMonth())
      return { wi, label: d.toLocaleString('vi-VN', { month: 'short' }) }
    return null
  }).filter(Boolean)

  const CELL = 28, GAP = 4
  const cellColor = (min, future) => {
    if (future) return 'transparent'
    if (min === 0) return '#F3F4F6'
    if (min < 15)  return '#FECACA'
    if (min < 60)  return '#F87171'
    return RED
  }
  const formatDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (loading) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 13 }}>Đang tải...</div>
  )

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .hmscroll::-webkit-scrollbar { height: 6px; }
        .hmscroll::-webkit-scrollbar-track { background: transparent; }
        .hmscroll::-webkit-scrollbar-thumb { background: #FECACA; border-radius: 10px; }
        .hmscroll::-webkit-scrollbar-thumb:hover { background: #FCA5A5; }
      `}</style>

      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x, top: tooltip.y - 48,
          transform: 'translateX(-50%)',
          background: '#1F2937', color: WHITE, borderRadius: 8,
          padding: '7px 12px', fontSize: 12, fontWeight: 600,
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,.25)',
        }}>
          {tooltip.minutes > 0
            ? `Bạn đã học trong ${tooltip.minutes} phút vào ngày ${formatDate(tooltip.date)}`
            : `Không có hoạt động vào ngày ${formatDate(tooltip.date)}`}
          <div style={{
            position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1F2937',
          }}/>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginRight: 'auto' }}>Tần suất học tập</div>
        {[['#F3F4F6','Không có hoạt động'],['#FECACA','<15 phút'],['#F87171','15–60 phút'],[RED,'>60 phút']].map(([c,l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,.08)', flexShrink: 0 }}/>{l}
          </span>
        ))}
      </div>

      <div ref={scrollRef} className="hmscroll" style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', marginLeft: 36, marginBottom: 6 }}>
            {weeks.map((week, wi) => {
              const ml = monthLabels.find(m => m.wi === wi)
              return (
                <div key={wi} style={{ width: CELL, marginRight: GAP, fontSize: 11, color: ml ? TEXT : 'transparent', fontWeight: 700, whiteSpace: 'nowrap', userSelect: 'none' }}>
                  {ml?.label || '·'}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 8, flexShrink: 0 }}>
              {['T2','T3','T4','T5','T6','T7','CN'].map((d, i) => (
                <div key={i} style={{ height: CELL, width: 24, fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', userSelect: 'none', fontWeight: 500 }}>
                  {[0,2,4,6].includes(i) ? d : ''}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: GAP }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    onMouseEnter={e => {
                      if (!cell.future) {
                        const r = e.currentTarget.getBoundingClientRect()
                        setTooltip({ x: r.left + r.width / 2, y: r.top, date: cell.date, minutes: cell.minutes })
                        e.currentTarget.style.transform = 'scale(1.2)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.15)'
                        e.currentTarget.style.position = 'relative'
                        e.currentTarget.style.zIndex = '10'
                      }
                    }}
                    onMouseLeave={e => {
                      setTooltip(null)
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    style={{
                      width: CELL, height: CELL, borderRadius: 6,
                      background: cellColor(cell.minutes, cell.future),
                      border: cell.future ? 'none' : cell.isToday ? `2px solid ${RED}` : '1px solid rgba(0,0,0,.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800,
                      color: (!cell.future && cell.minutes > 0) ? WHITE : 'transparent',
                      cursor: cell.future ? 'default' : 'pointer',
                      transition: 'transform .1s, box-shadow .1s',
                      userSelect: 'none', flexShrink: 0,
                    }}
                  >
                    {!cell.future && cell.minutes > 0 ? cell.minutes : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Profile({ user, profile, isPremium, onProfileUpdate }) {
  const navigate = useNavigate()
  const [targetBand, setTargetBand] = useState(profile?.target_band || '')
  const [showModal, setShowModal] = useState(false)
  const [examResult, setExamResult] = useState(null)
  const [totalHours, setTotalHours] = useState(0)
  const [toast, setToast] = useState('')
  const [tabHov, setTabHov] = useState(false)
  const [streak, setStreak]               = useState(profile?.streak_current || 0)
  const [longestStreak, setLongestStreak] = useState(profile?.streak_longest || 0)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('streak_current, streak_longest')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStreak(data.streak_current || 0)
          setLongestStreak(data.streak_longest || 0)
        }
      })
  }, [user?.id])
  const displayName   = (profile?.full_name?.trim()) || user?.email?.split('@')[0] || 'Học viên'
  const initials      = displayName.charAt(0).toUpperCase()

  useEffect(() => {
    if (!user?.id) return
    getLatestExamResult(user.id).then(r => setExamResult(r))
    supabase
      .from('study_sessions').select('minutes_studied').eq('user_id', user.id)
      .then(({ data }) => {
        const total = (data || []).reduce((s, r) => s + (r.minutes_studied || 0), 0)
        setTotalHours(Math.round(total / 60 * 10) / 10)
      })
  }, [user?.id])

  const handleSaveBand = async (band) => {
    setTargetBand(band); setShowModal(false)
    try {
      await updateProfile(user.id, { target_band: band })
      setToast('Đã lưu mục tiêu!')
      setTimeout(() => setToast(''), 2200)
      if (onProfileUpdate) onProfileUpdate({ ...profile, target_band: band })
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{ minHeight: '100vh', background: RED_PALE, fontFamily: 'inherit' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: '#DCFCE7', border: '1px solid #86EFAC',
          borderRadius: 12, padding: '11px 20px',
          fontSize: 13, fontWeight: 700, color: '#166534',
          boxShadow: '0 6px 20px rgba(0,0,0,.1)',
        }}>✓ {toast}</div>
      )}

      {showModal && <BandModal current={targetBand} onSave={handleSaveBand} onClose={() => setShowModal(false)} />}

      {/* ── Banner: all 4 corners rounded via overflow hidden on wrapper ── */}
      <div style={{ margin: '0', borderRadius: '0 0 0 0', overflow: 'hidden', position: 'relative', }}>
        <div style={{
          background: `
            radial-gradient(ellipse at 15% 60%, rgba(185,28,28,.18) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(220,38,38,.12) 0%, transparent 50%),
            linear-gradient(140deg, #FEE2E2 0%, #FECACA 50%, #FCA5A5 100%)
          `,
          position: 'relative', padding: '32px 0',
          animation: 'fadeUp 0.4s cubic-bezier(.4,0,.2,1) both',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: .04, pointerEvents: 'none',
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 23px, ${RED} 23px, ${RED} 24px),
              repeating-linear-gradient(90deg, transparent, transparent 23px, ${RED} 23px, ${RED} 24px)
            `,
          }}/>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{
                  width: 66, height: 66, borderRadius: '50%',
                  background: RED, color: WHITE, fontWeight: 900, fontSize: 27,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(185,28,28,.38)',
                  border: '3px solid rgba(255,255,255,.5)', flexShrink: 0, userSelect: 'none',
                }}>{initials}</div>
                <div>
                  <div style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 900, color: RED, letterSpacing: '-.4px' }}>
                    Hi, {displayName}
                  </div>
                  <div style={{ fontSize: 13, color: '#7F1D1D', marginTop: 3, fontWeight: 500 }}>
                    Biển học vô biên, lấy kiên trì làm bến. Mây xanh không lối, lấy chí cả dựng lên!
                  </div>
                </div>
              </div>
              <JourneyStrip examResult={examResult} targetBand={targetBand} onSetGoal={() => setShowModal(true)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar: Overview styled like Premium banner ─────────────────── */}
    <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, animation: 'fadeUp 0.4s cubic-bezier(.4,0,.2,1) .1s both' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: 64 }}>
            {/* Left line */}
            <div style={{ flex: 1, height: 1, background: tabHov ? RED : BORDER, opacity: tabHov ? .4 : 1, boxShadow: tabHov ? `0 0 8px 2px rgba(185,28,28,.25)` : 'none', transition: 'all .2s' }}/>
            {/* Overview pill — same style as Premium banner */}
            <div
              onMouseEnter={() => setTabHov(true)}
              onMouseLeave={() => setTabHov(false)}
              style={{
                margin: '0 16px', flexShrink: 0,
                borderRadius: 14,
                border: `1.5px solid ${RED}`,
                background: tabHov ? RED_LIGHT : WHITE,
                padding: '10px 32px',
                fontSize: 14, fontWeight: 700, color: RED,
                cursor: 'default', userSelect: 'none',
                transition: 'all .2s',
                boxShadow: tabHov
                  ? `0 6px 24px rgba(185,28,28,.22), 0 0 0 3px rgba(185,28,28,.08)`
                  : `0 1px 4px rgba(185,28,28,.1)`,
              }}
            >Overview</div>
            {/* Right line */}
            <div style={{ flex: 1, height: 1, background: tabHov ? RED : BORDER, opacity: tabHov ? .4 : 1, boxShadow: tabHov ? `0 0 8px 2px rgba(185,28,28,.25)` : 'none', transition: 'all .2s' }}/>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,48px) 60px' }}>
        <div style={{ marginBottom: 20, animation: 'fadeUp 0.4s cubic-bezier(.4,0,.2,1) .18s both' }}>
          <PremiumBanner isPremium={isPremium} planExpiresAt={profile?.plan_expires_at} onUpgrade={() => navigate('/subscription')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,280px),1fr))', gap: 22, alignItems: 'start' }}>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 'clamp(16px,3vw,28px)', minWidth: 0, animation: 'fadeUp 0.4s cubic-bezier(.4,0,.2,1) .26s both' }}>
            <Heatmap userId={user?.id} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.4s cubic-bezier(.4,0,.2,1) .34s both' }}>
            <StatCard icon={<IconClock />}  label="Tổng thời lượng" value={`${totalHours} giờ`} />
            <StatCard icon={<IconFlame />}  label="Streak hiện tại" value={`${streak} ngày`} />
            <StatCard icon={<IconTrophy />} label="Streak dài nhất" value={`${longestStreak} ngày`} />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .profile-body-grid { grid-template-columns: 1fr 280px !important; }
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}