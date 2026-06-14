import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { signOut } from './lib/auth'
import { useStreak } from './hooks/useStreak'

import LandingPage from './pages/LandingPage'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import TestPractice from './pages/TestPractice'
import EntranceExam from './pages/EntranceExam'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Subscription from './pages/Subscription'
import Admin from './pages/Admin'
import ExerciseView from './pages/ExerciseView'


// ── Constants ──
const RED = '#B91C1C'
const RED_MID = '#DC2626'
const RED_LIGHT = '#FEF2F2'
const RED_DARK = '#7F1D1D'

// ── Nav items ──
const NAV = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Overview',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'testpractice',
    path: '/testpractice',
    label: 'Test Practice',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    id: 'leaderboard',
    path: '/leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    path: '/profile',
    label: 'Learning Profile',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

// ── Loading screen ──
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #7F1D1D 0%, #B91C1C 50%, #EF4444 100%)',
      flexDirection: 'column', gap: 20
    }}>
      <img src="/ielts-logo.png" alt="IELTS Instructor"
        style={{ height: 56, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
      <div style={{ display: 'flex', gap: 7 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.7)',
            animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  )
}

// ── Streak Badge ──
function StreakBadge({ streak, streakLit, minutesToday }) {
  const [hov, setHov] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: streakLit
            ? 'rgba(34,197,94,0.18)'
            : hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.13)',
          border: `1.5px solid ${streakLit ? 'rgba(34,197,94,0.45)' : hov ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'}`,
          padding: '8px 16px', borderRadius: 28, cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hov ? 'translateY(-1px)' : 'translateY(0)',
          boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.18)' : 'none'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="flameG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={streakLit ? '#FBBF24' : '#FCA5A5'} />
              <stop offset="100%" stopColor={streakLit ? '#EF4444' : '#B91C1C'} />
            </linearGradient>
          </defs>
          <path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11z" fill="url(#flameG)" opacity="0.9"/>
          <path d="M12 10c0 0-2 2.5-2 4a2 2 0 004 0c0-1.5-2-4-2-4z" fill="#fff" opacity="0.45"/>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>{streak}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.3 }}>NGÀY STREAK</span>
        </div>
        {streakLit && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80', flexShrink: 0 }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          width: 300, background: '#fff', borderRadius: 18,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)', padding: '22px 22px',
          zIndex: 999, animation: 'dropIn 0.2s cubic-bezier(.34,1.56,.64,1)'
        }}>
          <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-8px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
          <div style={{ position: 'absolute', top: -6, right: 24, width: 14, height: 14, background: '#fff', transform: 'rotate(45deg)', boxShadow: '-2px -2px 5px rgba(0,0,0,0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, #FCA5A5 0%, #B91C1C 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(185,28,28,0.35)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11z" fill="#fff" opacity="0.9"/>
                <path d="M12 10c0 0-2 2.5-2 4a2 2 0 004 0c0-1.5-2-4-2-4z" fill="#fff" opacity="0.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: RED, lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>ngày liên tiếp</div>
            </div>
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
              <span>Tiến độ hôm nay</span>
              <span style={{ fontWeight: 700, color: streakLit ? '#22C55E' : RED }}>{minutesToday}/30 phút</span>
            </div>
            <div style={{ background: '#E5E7EB', borderRadius: 99, height: 8 }}>
              <div style={{
                width: `${Math.min((minutesToday / 30) * 100, 100)}%`, height: '100%',
                background: streakLit ? 'linear-gradient(90deg, #22C55E, #16A34A)' : `linear-gradient(90deg, ${RED}, ${RED_DARK})`,
                borderRadius: 99, transition: 'width 0.6s ease'
              }} />
            </div>
          </div>
          {[
            'Học ít nhất 30 phút mỗi ngày',
            'Duy trì chuỗi bằng cách học tập mỗi ngày',
            'Giữ chuỗi, đua top, nhận thưởng',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', background: RED_LIGHT, color: RED,
                fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>{i + 1}</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.5, paddingTop: 3 }}>{tip}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Avatar Dropdown ──
function AvatarDropdown({ profile, user, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const initials = (profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${RED} 0%, ${RED_DARK} 100%)`,
          color: '#fff', fontWeight: 800, fontSize: 17,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: open ? '0 0 0 3px rgba(255,255,255,0.3), 0 4px 14px rgba(185,28,28,0.5)' : '0 2px 10px rgba(185,28,28,0.4)',
          transition: 'all 0.18s ease',
          transform: open ? 'scale(1.06)' : 'scale(1)',
          border: '2px solid rgba(255,255,255,0.7)'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.25), 0 4px 14px rgba(185,28,28,0.5)' }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(185,28,28,0.4)' }}}
      >
        {initials}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          width: 240, background: '#fff', borderRadius: 16,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18)', overflow: 'hidden', zIndex: 999,
          animation: 'dropIn2 0.2s cubic-bezier(.34,1.56,.64,1)'
        }}>
          <style>{`@keyframes dropIn2{from{opacity:0;transform:translateY(-6px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111' }}>{profile?.full_name || 'Học viên'}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>{user?.email}</div>
          </div>
          <div style={{ padding: '10px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#555' }}>Ngôn ngữ</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Tiếng Việt</span>
          </div>
          <button onClick={onSignOut}
            style={{
              width: '100%', padding: '14px 18px', background: 'none', border: 'none',
              textAlign: 'left', fontSize: 14, color: '#EF4444', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}

// ── Protected Route ──
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/auth" replace />
  return children
}

// ── Admin Gate ──
function AdminGate() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('denied'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()

      setStatus(profile?.is_admin === true ? 'allowed' : 'denied')
    }
    check()
  }, [])

  if (status === 'loading') return <LoadingScreen />
  if (status === 'denied') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #7F1D1D 0%, #B91C1C 100%)',
      flexDirection: 'column', gap: 16, fontFamily: "'Segoe UI',sans-serif"
    }}>
      <div style={{ fontSize: 48 }}>🚫</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Không có quyền truy cập</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>Tài khoản của bạn không phải Admin</div>
      <a href="/" style={{ marginTop: 8, color: '#fff', fontSize: 14, opacity: 0.7 }}>← Về trang chủ</a>
    </div>
  )
  return <Admin />
}

// ── Main Layout ──
function MainLayout({ user, profile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hoveredNav, setHoveredNav] = useState(null)
  const { minutesToday, streakLit } = useStreak(user?.id)

  const TOPBAR_H = 64

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleNavClick = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const currentNav = NAV.find(n => location.pathname.startsWith(n.path))

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #7F1D1D 0%, #B91C1C 35%, #EF4444 65%, #FECACA 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: 'flex'
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(185,28,28,0.3); border-radius: 99px; }
        .nav-btn { transition: all 0.18s ease !important; }
        .nav-btn:hover:not(.active) { background: rgba(255,255,255,0.16) !important; transform: translateX(2px); }
        .nav-btn.active { background: #fff !important; }
        @media(max-width: 768px) {
          .sidebar { display: none !important; }
          .sidebar.open { display: flex !important; width: 260px !important; z-index: 300 !important; }
          .main-area { margin-left: 0 !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 140,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}
      {/* ── Sidebar ── */}
      <div
        className={`sidebar${sidebarOpen ? ' open' : ''}`}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        style={{
          position: 'fixed', top: TOPBAR_H, bottom: 0, left: 0,
          width: collapsed ? 68 : 230,
          background: 'linear-gradient(180deg, #8B0000 0%, #C01515 60%, #E53E3E 100%)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          boxShadow: '4px 0 28px rgba(0,0,0,0.22)',
          zIndex: 150,
        }}
      >
        <nav style={{ flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(n => {
            const isActive = location.pathname.startsWith(n.path)
            return (
              <button
                key={n.id}
                className={`nav-btn${isActive ? ' active' : ''}`}
                onClick={() => handleNavClick(n.path)}
                onMouseEnter={() => setHoveredNav(n.id)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '12px 13px',
                  borderRadius: 12, border: 'none',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? RED : '#fff',
                  fontWeight: isActive ? 800 : 500, fontSize: 15,
                  cursor: 'pointer', textAlign: 'left',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  flexShrink: 0, width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? RED : '#fff'
                }}>{n.icon}</span>
                <span style={{
                  opacity: collapsed && !sidebarOpen ? 0 : 1, transition: 'opacity 0.15s',
                  transitionDelay: (collapsed && !sidebarOpen) ? '0s' : '0.08s'
                }}>{n.label}</span>
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          <button
            onClick={handleSignOut}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateX(2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              width: '100%', padding: '12px 13px', borderRadius: 12,
              border: 'none', background: 'transparent',
              color: 'rgba(255,255,255,0.65)', fontSize: 15, fontWeight: 500,
              cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
              transition: 'all 0.18s ease'
            }}
          >
            <span style={{ flexShrink: 0, width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span style={{
              opacity: collapsed && !sidebarOpen ? 0 : 1, transition: 'opacity 0.15s',
              transitionDelay: (collapsed && !sidebarOpen) ? '0s' : '0.08s'
            }}>
              Đăng xuất
            </span>
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div
        className="main-area"
        style={{
          marginLeft: 68, flex: 1, minWidth: 0,
          paddingTop: TOPBAR_H,
          display: 'flex', flexDirection: 'column',
          transition: 'margin-left 0.25s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Topbar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          height: TOPBAR_H,
          background: 'linear-gradient(90deg, #7F1D1D 0%, #991B1B 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setSidebarOpen(o => !o)
                } else {
                  setCollapsed(o => !o)
                }
              }}
              style={{
                background: 'none', border: 'none',
                padding: '6px 8px', cursor: 'pointer',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, borderRadius: 8,
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: '#FFF5F5', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
              }}>
                <img src="/ielts-logo.png" alt="IELTS" style={{ height: 26, width: 26, objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: 0.3 }}>IELTS</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.2 }}>Instructor</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <StreakBadge
              streak={profile?.streak_current || 0}
              streakLit={streakLit}
              minutesToday={minutesToday}
            />
            <AvatarDropdown profile={profile} user={user} onSignOut={handleSignOut} />
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: '28px 28px 48px', overflowY: 'auto' }}>
          <div style={{
            background: '#fff',
            borderRadius: 22,
            minHeight: 'calc(100vh - 140px)',
            boxShadow: '0 10px 48px rgba(0,0,0,0.18)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '32px 32px' }}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Root App ──
export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setProfile(null); return }
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()  // ← đổi ở đây
      .then(({ data }) => setProfile(data))
  }, [user])

  const isPremium = profile?.plan === 'premium'

  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage user={user} />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<Auth />} />
        <Route path="/reset-password" element={<Auth mode="reset" />} />
        <Route path="/admin" element={<AdminGate />} />

        {/* ── Fullscreen routes (no MainLayout shell) ── */}
        <Route path="/exercise/:id" element={
          <ProtectedRoute user={user}>
            <ExerciseView user={user} profile={profile} />
          </ProtectedRoute>
        } />
        <Route path="/entrance-exam" element={
          <ProtectedRoute user={user}>
            <EntranceExam user={user} />
          </ProtectedRoute>
        } />

        {/* ── App shell routes ── */}
        <Route
          element={
            <ProtectedRoute user={user}>
              <MainLayout user={user} profile={profile} />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"     element={<Dashboard     user={user} profile={profile} isPremium={isPremium} />} />
          <Route path="/testpractice"  element={<TestPractice  user={user} profile={profile} isPremium={isPremium} />} />
          <Route path="/profile" element={<Profile user={user} profile={profile} onProfileUpdate={setProfile} isPremium={isPremium} />} />
          <Route path="/leaderboard"   element={<Leaderboard   user={user} />} />
          <Route path="/subscription"  element={<Subscription  user={user} profile={profile} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}