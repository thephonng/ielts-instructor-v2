import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Tokens ──────────────────────────────────────────────────────
const T = {
  red:       '#B91C1C',
  redDark:   '#991B1B',
  redDeep:   '#7F1D1D',
  redMid:    '#DC2626',
  redLight:  '#FEF2F2',
  redBorder: '#FECACA',
  gold:      '#D97706',
  silver:    '#9CA3AF',
  bronze:    '#B45309',
  white:     '#FFFFFF',
  text:      '#111827',
  textMid:   '#374151',
  textMute:  '#9CA3AF',
  border:    '#F3F4F6',
  borderMid: '#E5E7EB',
}

// ─── Helpers ─────────────────────────────────────────────────────
function fmtMinutes(min) {
  if (!min || min === 0) return '0 phút'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} phút`
  if (m === 0) return `${h}h`
  return `${h}h ${m}p`
}
function getInitial(name) { return (name || '?').trim().charAt(0).toUpperCase() }
function endOfMonth() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth() + 1, 1)
}
function useCountdown() {
  const [diff, setDiff] = useState(endOfMonth() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setDiff(endOfMonth() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const t = Math.max(0, diff)
  return {
    d: Math.floor(t / 86400000),
    h: Math.floor((t % 86400000) / 3600000),
    m: Math.floor((t % 3600000) / 60000),
    s: Math.floor((t % 60000) / 1000),
  }
}

// ─── Build sorted leaderboard from raw rows ───────────────────────
function buildLeaderboard(rows) {
  const map = {}
  rows.forEach(r => {
    const uid = r.user_id
    if (!map[uid]) {
      map[uid] = {
        id:         uid,
        name:       r.profiles?.full_name || 'Ẩn danh',
        avatar_url: r.profiles?.avatar_url || null,
        minutes:    0,
      }
    }
    map[uid].minutes += r.minutes_studied || 0
  })
  return Object.values(map).sort((a, b) => b.minutes - a.minutes)
}

// ─── SVG Icons ───────────────────────────────────────────────────
const IconCamera = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
)
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconMedal = ({ rank }) => {
  const c = rank === 1 ? T.gold : rank === 2 ? T.silver : T.bronze
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  )
}
const IconUser = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={T.textMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconTrophy = ({ size = 22, color = 'rgba(255,255,255,0.9)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)
const IconLive = () => (
  <svg width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4" fill="#22C55E"/>
  </svg>
)

// ─── Avatar ───────────────────────────────────────────────────────
function Avatar({ url, name, size = 44, isMe = false, editable = false, onUpload, border }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [hover, setHover] = useState(false)
  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); try { await onUpload?.(file) } finally { setUploading(false) }
  }
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div
        onMouseEnter={() => editable && setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => editable && fileRef.current?.click()}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: url ? 'transparent' : (isMe ? T.red : '#E5E7EB'),
          border: border || (isMe ? `3px solid ${T.red}` : `2px solid ${T.borderMid}`),
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: editable ? 'pointer' : 'default', position: 'relative',
          boxShadow: isMe ? `0 0 0 3px rgba(185,28,28,0.15)` : 'none',
        }}
      >
        {url
          ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: size * 0.38, fontWeight: 700, color: isMe ? '#fff' : T.textMid, lineHeight: 1, userSelect: 'none' }}>
              {getInitial(name)}
            </span>
        }
        {editable && hover && !uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#fff' }}>
            <IconCamera />
          </div>
        )}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

// ─── Countdown ────────────────────────────────────────────────────
function Countdown() {
  const { d, h, m, s } = useCountdown()
  const pad = v => String(v).padStart(2, '0')
  const unit = (v, lbl) => (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 30, fontWeight: 900, color: T.red, lineHeight: 1, letterSpacing: '-0.03em' }}>{pad(v)}</div>
      <div style={{ fontSize: 10, color: T.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 5 }}>{lbl}</div>
    </div>
  )
  const sep = <div style={{ fontSize: 24, fontWeight: 800, color: T.redBorder, paddingBottom: 16, lineHeight: 1, flexShrink: 0 }}>:</div>
  return (
    <div style={{
      width: '100%',
      background: T.redLight,
      border: `1.5px solid ${T.redBorder}`,
      borderRadius: 16,
      padding: '18px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.red }}>
        <IconClock />
        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reset trong</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, width: '100%', maxWidth: 480, justifyContent: 'center' }}>
        {unit(d,'ngày')} {sep} {unit(h,'giờ')} {sep} {unit(m,'phút')} {sep} {unit(s,'giây')}
      </div>
    </div>
  )
}

// ─── Podium config ────────────────────────────────────────────────
// Widths are flex-based (% of podium row), heights are fixed px
const PODIUM = {
  1: {
    flexGrow: 1.35,
    frontH:   220,
    capH:     30,
    frontBg:  'linear-gradient(175deg, #EF4444 0%, #C8102E 40%, #7F1D1D 100%)',
    capBg:    'linear-gradient(180deg, #F87171 0%, #DC2626 100%)',
    prize:    'Giảm 50% tháng tới',
    avatarSz: 84,
    medal:    '#D97706',
    label:    'Hạng nhất',
  },
  2: {
    flexGrow: 1,
    frontH:   160,
    capH:     24,
    frontBg:  'linear-gradient(175deg, #F87171 0%, #B91C1C 40%, #7F1D1D 100%)',
    capBg:    'linear-gradient(180deg, #FCA5A5 0%, #DC2626 100%)',
    prize:    'Giảm 30% tháng tới',
    avatarSz: 68,
    medal:    '#C0C0C0',
    label:    'Hạng nhì',
  },
  3: {
    flexGrow: 0.85,
    frontH:   120,
    capH:     20,
    frontBg:  'linear-gradient(175deg, #FCA5A5 0%, #991B1B 40%, #7F1D1D 100%)',
    capBg:    'linear-gradient(180deg, #FECACA 0%, #B91C1C 100%)',
    prize:    'Giảm 15% tháng tới',
    avatarSz: 60,
    medal:    '#CD7F32',
    label:    'Hạng ba',
  },
}

// ─── PodiumBlock ─────────────────────────────────────────────────
function PodiumBlock({ entry, rank, isMe, onUpload, avatarUrl }) {
  const c = PODIUM[rank]
  const empty = !entry
  const [hovered, setHovered] = useState(false)

  const emptyFront = 'linear-gradient(175deg,#F9FAFB 0%,#E5E7EB 60%,#D1D5DB 100%)'
  const emptyCap   = 'linear-gradient(180deg,#F3F4F6 0%,#E5E7EB 100%)'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: c.flexGrow,
        minWidth: 0,
        transition: 'transform 0.22s ease',
        transform: hovered && !empty ? 'translateY(-8px)' : 'translateY(0)',
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 14, width: '100%' }}>
        {empty ? (
          <div style={{
            width: c.avatarSz, height: c.avatarSz, borderRadius: '50%',
            background: '#F3F4F6', border: `2px dashed ${T.borderMid}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconUser size={c.avatarSz * 0.44} />
          </div>
        ) : (
          <Avatar
            url={isMe ? (avatarUrl || entry.avatar_url) : entry.avatar_url}
            name={entry.name}
            size={c.avatarSz}
            isMe={isMe}
            editable={isMe}
            onUpload={onUpload}
            border={`3px solid ${c.medal}`}
          />
        )}
        <div style={{
          fontSize: rank === 1 ? 15 : 13,
          fontWeight: 700,
          color: T.text,
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}>
          {empty ? '—' : (entry.name || 'Ẩn danh')}
        </div>
        {!empty && (
          <div style={{ fontSize: rank === 1 ? 15 : 13, fontWeight: 800, color: T.red }}>
            {fmtMinutes(entry.minutes)}
          </div>
        )}
      </div>

      {/* 3D platform: top cap + front face */}
      <div style={{ width: '100%', position: 'relative' }}>
        {/* Top cap — recedes back */}
        <div style={{
          width: '100%',
          height: c.capH,
          background: empty ? emptyCap : c.capBg,
          borderRadius: '10px 10px 0 0',
          transform: 'perspective(400px) rotateX(28deg)',
          transformOrigin: 'bottom center',
          marginBottom: -2,
          clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
          boxShadow: empty ? 'none' : `0 -4px 24px rgba(185,28,28,0.22)`,
        }} />

        {/* Front face */}
        <div style={{
          width: '100%',
          height: c.frontH,
          background: empty ? emptyFront : c.frontBg,
          borderRadius: '0 0 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: hovered && !empty
            ? '0 20px 50px rgba(185,28,28,0.35), 0 8px 20px rgba(185,28,28,0.2)'
            : '0 8px 30px rgba(185,28,28,0.12)',
        }}>
          {/* Diagonal texture */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }}>
            <defs>
              <pattern id={`tex${rank}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <line x1="0" y1="16" x2="16" y2="0" stroke="#fff" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#tex${rank})`}/>
          </svg>
          {/* Sheen */}
          <div style={{ position: 'absolute', top: 0, left: '-20%', width: '18%', height: '100%', background: 'rgba(255,255,255,0.1)', transform: 'skewX(-8deg)', pointerEvents: 'none' }} />

          {!empty && (
            <>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconTrophy size={rank === 1 ? 28 : 22} />
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textAlign: 'center', padding: '0 16px', lineHeight: 1.4 }}>
                {c.prize}
              </div>
            </>
          )}
          {empty && (
            <span style={{ fontSize: 13, color: T.textMute, fontWeight: 600 }}>{c.label}</span>
          )}
        </div>

        {/* Ground shadow */}
        <div style={{
          height: 12,
          background: 'radial-gradient(ellipse at center, rgba(185,28,28,0.16) 0%, transparent 70%)',
          filter: 'blur(3px)',
          marginTop: 2,
        }} />
      </div>
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────
function Row({ entry, rank, isMe, onUpload, avatarUrl }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
        background: isMe ? T.redLight : (hovered ? '#FAFAFA' : T.white),
        borderLeft: isMe ? `3px solid ${T.red}` : '3px solid transparent',
        transition: 'background 0.12s',
      }}
    >
      <div style={{ width: 26, textAlign: 'center', flexShrink: 0 }}>
        {rank <= 3
          ? <IconMedal rank={rank} />
          : <span style={{ fontSize: 12, fontWeight: 700, color: rank <= 5 ? T.textMid : T.textMute }}>#{rank}</span>
        }
      </div>
      <Avatar
        url={isMe ? (avatarUrl || entry.avatar_url) : entry.avatar_url}
        name={entry.name} size={36} isMe={isMe} editable={isMe} onUpload={onUpload}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? T.red : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.name || 'Ẩn danh'}
          {isMe && <span style={{ fontSize: 11, color: T.red, fontWeight: 400, marginLeft: 6 }}>· Bạn</span>}
        </div>
        {rank <= 3 && (
          <div style={{ fontSize: 11, color: T.textMute, marginTop: 1 }}>{PODIUM[rank].prize}</div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: isMe ? T.red : T.textMid }}>{fmtMinutes(entry.minutes)}</div>
        <div style={{ fontSize: 10, color: T.textMute, marginTop: 1 }}>học tháng này</div>
      </div>
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 20px' }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontSize: 10, color: T.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────
export default function Leaderboard({ user, profile }) {
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null)
  // Keep raw rows in a ref so real-time patches can update them efficiently
  const rowsRef = useRef([])

  const monthStart = (() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`
  })()

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: rows, error } = await supabase
          .from('study_sessions')
          .select('user_id, minutes_studied, profiles(id, full_name, avatar_url)')
          .gte('date', monthStart)

        if (error) {
          console.error('Leaderboard fetch error:', error.message, error.details, error.hint)
          setData([])
          return
        }

        rowsRef.current = rows
        setData(buildLeaderboard(rows))
      } catch (e) {
        console.error('Leaderboard load error:', e)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  // ── Real-time subscription ────────────────────────────────────
  useEffect(() => {
    let timer = null
  
    const channel = supabase
      .channel('leaderboard_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_sessions',
        filter: `date=gte.${monthStart}`,
      }, () => {
        // Debounce 2s — tránh re-fetch liên tục
        clearTimeout(timer)
        timer = setTimeout(async () => {
          const { data: rows, error } = await supabase
            .from('study_sessions')
            .select('user_id, minutes_studied, profiles(id, full_name, avatar_url)')
            .gte('date', monthStart)
          if (!error) {
            rowsRef.current = rows
            setData(buildLeaderboard(rows))
          }
        }, 2000)
      })
      .subscribe()
  
    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [monthStart])

  // ── Avatar sync ───────────────────────────────────────────────
  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
  }, [profile?.avatar_url])

  const handleUpload = useCallback(async (file) => {
    if (!user?.id) return
    try {
      const ext  = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(publicUrl)
      setData(prev => prev.map(u => u.id === user.id ? { ...u, avatar_url: publicUrl } : u))
    } catch (e) {
      console.error('Avatar upload error:', e)
    }
  }, [user?.id])

  const top3      = data.slice(0, 3)
  const listAll   = data.slice(0, 10)
  const myRank    = data.findIndex(u => u.id === user?.id) + 1
  const myEntry   = data.find(u => u.id === user?.id)
  const myInTop10 = myRank >= 1 && myRank <= 10

  const podiumOrder = [
    { entry: top3[1], rank: 2 },
    { entry: top3[0], rank: 1 },
    { entry: top3[2], rank: 3 },
  ]

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse   { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.3s ease' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>Bảng xếp hạng</h2>
            <p style={{ fontSize: 13, color: T.textMute, margin: '4px 0 0' }}>
              Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()} · xếp hạng theo tổng giờ học
            </p>
          </div>
          {/* Live badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '4px 12px', flexShrink: 0 }}>
            <div style={{ animation: 'pulse 2s ease-in-out infinite' }}><IconLive /></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', letterSpacing: '0.05em' }}>Trực tiếp</span>
          </div>
        </div>

        {loading ? (
          <div style={{ background: T.white, border: `1px solid ${T.borderMid}`, borderRadius: 14, padding: 60, textAlign: 'center', color: T.textMute, fontSize: 14 }}>
            Đang tải...
          </div>
        ) : (
          <>
            {/* ── Podium card — full width ── */}
            <div style={{
              background: `
                radial-gradient(ellipse at 50% 0%, rgba(254,226,226,0.95) 0%, rgba(255,241,242,0.55) 55%, transparent 100%),
                repeating-linear-gradient(45deg, rgba(185,28,28,0.02) 0px, rgba(185,28,28,0.02) 1px, transparent 1px, transparent 20px),
                #fff
              `,
              border: `1px solid ${T.borderMid}`,
              borderRadius: 20,
              padding: '32px 40px 0',
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 28, textAlign: 'center' }}>
                Top 3 tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
              </div>

              {/* Platforms — full width flex row, aligned at bottom */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
                {podiumOrder.map(({ entry, rank }) => (
                  <PodiumBlock
                    key={rank}
                    entry={entry}
                    rank={rank}
                    isMe={entry?.id === user?.id}
                    onUpload={handleUpload}
                    avatarUrl={entry?.id === user?.id ? avatarUrl : null}
                  />
                ))}
              </div>

              {/* Clock + user status — full width inside card */}
              <div style={{
                borderTop: `1px solid ${T.borderMid}`,
                marginTop: 24,
                padding: '24px 0 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 12,
              }}>
                <Countdown />

                {myEntry ? (
                  <div style={{
                    background: T.redLight,
                    border: `1.5px solid ${T.redBorder}`,
                    borderRadius: 30,
                    padding: '11px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 14,
                    color: T.textMid,
                  }}>
                    <span>Bạn đã học</span>
                    <span style={{ fontWeight: 900, color: T.red, fontSize: 15 }}>{fmtMinutes(myEntry.minutes)}</span>
                    <span>và xếp hạng</span>
                    <span style={{ fontWeight: 900, color: T.red, fontSize: 15 }}>#{myRank}</span>
                  </div>
                ) : (
                  <div style={{
                    background: T.redLight,
                    border: `1.5px solid ${T.redBorder}`,
                    borderRadius: 30,
                    padding: '11px 28px',
                    textAlign: 'center',
                    fontSize: 13,
                    color: T.textMute,
                  }}>
                    Học đủ 30 phút hôm nay để xuất hiện trên bảng
                  </div>
                )}
              </div>
            </div>

            {/* ── Leaderboard list ── */}
            <div style={{ background: T.white, border: `1px solid ${T.borderMid}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 20px', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Học viên</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.textMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Thời gian học</span>
              </div>

              {listAll.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textMute, fontSize: 13 }}>
                  Chưa có dữ liệu tháng này — hãy bắt đầu học!
                </div>
              )}

              {listAll.map((entry, i) => (
                <div key={entry.id}>
                  <Row
                    entry={entry} rank={i + 1}
                    isMe={entry.id === user?.id}
                    onUpload={handleUpload}
                    avatarUrl={entry.id === user?.id ? avatarUrl : null}
                  />
                  {i < listAll.length - 1 && <div style={{ height: 1, background: T.border, marginLeft: 62 }} />}
                </div>
              ))}

              {myEntry && !myInTop10 && (
                <>
                  <Divider label={`Vị trí của bạn · #${myRank}`} />
                  <Row entry={myEntry} rank={myRank} isMe={true} onUpload={handleUpload} avatarUrl={avatarUrl} />
                </>
              )}

              {!myEntry && (
                <div style={{ padding: '14px 20px', background: T.redLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 13, color: T.red, fontWeight: 600 }}>Bạn chưa có mặt trên bảng</span>
                  <span style={{ fontSize: 12, color: T.textMute }}>Học đủ 30 phút để xuất hiện</span>
                </div>
              )}
            </div>

            {/* ── My rank bar ── */}
            {myEntry && (
              <div style={{
                background: T.white, border: `1px solid ${T.borderMid}`, borderRadius: 12,
                padding: '13px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar url={avatarUrl || myEntry.avatar_url} name={myEntry.name} size={38} isMe={true} editable={true} onUpload={handleUpload} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Thứ hạng của bạn</div>
                    <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>
                      Nhấn ảnh để thay avatar · {fmtMinutes(myEntry.minutes)} đã học tháng này
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.red, letterSpacing: '-0.03em', flexShrink: 0 }}>#{myRank}</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}