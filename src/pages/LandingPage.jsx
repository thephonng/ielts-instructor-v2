import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../lib/auth';

// ── Palette ────────────────────────────────────────────────────────────────────
const R = '#DC2626';
const RD = '#991B1B';
const RL = '#FEF2F2';
const HERO_BG =
  'radial-gradient(ellipse 140% 100% at 58% -18%, #FF6565 0%, #E53E3E 28%, #C01515 55%, #8B0000 80%, #5B0000 100%)';

// ── EmailJS config ─────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_pndfk7q';
const EMAILJS_TEMPLATE_ID = 'template_cgajcns';
const EMAILJS_PUBLIC_KEY  = 'gpnUZDnSZ0JbmVMag';

// ── CSS animations ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; }

  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn   { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes floatUp   { 0%,100% { transform: translateY(0); }  50% { transform: translateY(-14px); } }
  @keyframes floatSlow { 0%,100% { transform: translateY(0); }  50% { transform: translateY(-8px); }  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  ::-webkit-scrollbar       { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb { background: ${R}; border-radius: 10px; }

  ::placeholder { color: rgba(255,255,255,.4); }
  input:focus, textarea:focus, select:focus { outline: none; }

  .skill-card:hover { transform: translateY(-7px) !important; box-shadow: 0 22px 55px rgba(0,0,0,.22) !important; }
  .pricing-card:hover { transform: translateY(-5px) !important; }
  .cta-btn:hover { transform: translateY(-2px) !important; }
  .explore-btn:hover { background: rgba(255,255,255,0.28) !important; }
  .exam-cta-btn:hover { background: #b91c1c !important; transform: translateY(-2px) !important; }

  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .hamburger-btn { display: flex !important; }
    .contact-grid { flex-direction: column !important; }
    .contact-form-col { min-width: unset !important; }
    .contact-info-col { flex: unset !important; width: 100% !important; }
  }
  @media (min-width: 769px) {
    .hamburger-btn { display: none !important; }
    .mobile-menu-overlay { display: none !important; }
  }

  /* FIX: Contact form year/email stack on small screens */
  @media (max-width: 480px) {
    .contact-dob-email-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

// ── NAV DATA ───────────────────────────────────────────────────────────────────
const NAV = [
  {
    label: 'Reading',
    items: [
      { label: 'Bài đọc theo chủ đề',       sub: 'Công nghệ · Môi trường · Văn hoá · Khoa học...' },
      { label: 'Bài đọc theo dạng câu hỏi',  sub: 'MCQ · True/False/NG · Matching · Short answer' },
    ],
    onItemClick: 'auth',
  },
  {
    label: 'Writing',
    items: [
      { label: 'Writing Task 1', sub: 'Mô tả biểu đồ, bảng số liệu, sơ đồ' },
      { label: 'Writing Task 2', sub: 'Viết luận – lập luận – phân tích' },
    ],
    onItemClick: 'auth',
  },
  {
    label: 'Kiểm tra đầu vào',
    items: [
      { label: 'Kiểm tra nhanh 40 câu', sub: 'Đánh giá trình độ hiện tại của bạn' },
    ],
    onItemClick: 'entrance',
  },
  {
    label: 'Gói học',
    items: [
      { label: 'Gói Free',    sub: 'Bắt đầu hoàn toàn miễn phí' },
      { label: 'Gói Premium', sub: 'Chỉ 99.000đ / tháng – tiết kiệm 67%' },
    ],
    onItemClick: 'auth',
  },
];

// ── Helper: load script ────────────────────────────────────────────────────────
const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
  const s = document.createElement('script');
  s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

// ══════════════════════════════════════════════════════════════════════════════
export default function LandingPage({ setPage, user }) {
  const navigate = useNavigate();
  const [dropdown, setDropdown]   = useState(null);
  const [showAuth, setShowAuth]   = useState(false);
  const [authTab, setAuthTab]     = useState('login');
  const [sent, setSent]           = useState(false);
  const [sending, setSending]     = useState(false);
  const [form, setForm]           = useState({ name:'', phone:'', dob:'', email:'', role:'', course:'', msg:'' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // FIX: mobileSubMenu now tracks which NAV item is expanded (null = top level)
  const [mobileSubMenu, setMobileSubMenu]   = useState(null);
  const contactRef  = useRef(null);
  const featuresRef = useRef(null);
  const entranceRef = useRef(null);
  const [authRedirect, setAuthRedirect] = useState(null);

  const scrollTo = (ref) => { setDropdown(null); setMobileMenuOpen(false); ref.current?.scrollIntoView({ behavior:'smooth' }); };
  const openAuth = (tab = 'register') => { setAuthTab(tab); setShowAuth(true); setDropdown(null); setMobileMenuOpen(false); };
  const openAuthWithRedirect = (tab = 'login', redirect = null) => {
    setAuthRedirect(redirect);
    setAuthTab(tab);
    setShowAuth(true);
    setDropdown(null);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!dropdown) return;
    const handler = (e) => {
      if (!e.target.closest('[data-nav-item]')) setDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdown]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // ── EmailJS contact form ───────────────────────────────────────────────────
  const handleContactSend = async () => {
    if (!form.name || !form.phone) {
      alert('Vui lòng điền họ tên và số điện thoại!');
      return;
    }
    setSending(true);
    try {
      if (!window.emailjs) {
        await loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');
        window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      }
      await window.emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          phone:     form.phone,
          dob:       form.dob   || 'Không điền',
          email:     form.email || 'Không điền',
          role:      form.role  || 'Không điền',
          course:    form.course|| 'Không điền',
          message:   form.msg   || 'Không có nội dung',
          to_email:  'contact.ieltsinstructor@gmail.com',
          title:     `Tư vấn từ ${form.name}`,
          name:      form.name,
        }
      );
      setSent(true);
    } catch (err) {
      console.error('EmailJS error:', err);
      alert('Gửi thất bại, vui lòng thử lại hoặc liên hệ trực tiếp!');
    } finally {
      setSending(false);
    }
  };

  // ── Mobile menu: handle item action ──────────────────────────────────────
  // Called when user taps a sub-item inside a mobile nav section
  const handleMobileSubItemClick = (navItem) => {
    setMobileMenuOpen(false);
    setMobileSubMenu(null);
    if (navItem.onItemClick === 'entrance') {
      // Small delay so menu closes before scroll
      setTimeout(() => entranceRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } else if (navItem.onItemClick === 'auth') {
      openAuth('register');
    }
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif", minHeight:'100vh', overflowX:'hidden' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ════════════════════ NAVBAR ════════════════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:1000,
        height:68, padding:'0 24px',
        background:'rgba(255,255,255,.97)', backdropFilter:'blur(12px)',
        boxShadow:'0 1px 0 rgba(0,0,0,.07), 0 4px 24px rgba(0,0,0,.05)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <img src="/ielts-logo.png" alt="IELTS Instructor"
          style={{ height:40, width:'auto', display:'block', cursor:'pointer', userSelect:'none' }} />

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display:'flex', gap:2 }}>
          {NAV.map(({ label, items, onItemClick }) => (
            <NavDropdown
              key={label} label={label} items={items}
              open={dropdown === label}
              onToggle={() => setDropdown(dropdown === label ? null : label)}
              onClose={() => setDropdown(null)}
              onItemClick={
                onItemClick === 'entrance'
                  ? () => { setDropdown(null); entranceRef.current?.scrollIntoView({ behavior: 'smooth' }); }
                  : onItemClick === 'auth'
                  ? () => openAuth('register')
                  : null
                }
            />
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button className="cta-btn" onClick={() => openAuth('login')}
            style={{
              background:`linear-gradient(135deg,${R},${RD})`, color:'white',
              border:'none', padding:'11px 28px', borderRadius:50,
              fontWeight:800, fontSize:15, cursor:'pointer',
              boxShadow:`0 4px 16px rgba(220,38,38,.38)`,
              transition:'all .22s', fontFamily:'inherit', letterSpacing:'-.1px'
            }}
          >Bắt đầu</button>

          {/* Hamburger button */}
          <button
            className="hamburger-btn"
            onClick={() => { setMobileMenuOpen(true); setMobileSubMenu(null); }}
            style={{
              display:'none', flexDirection:'column', justifyContent:'center', alignItems:'center',
              gap:5, width:40, height:40, background:'transparent', border:'none', cursor:'pointer', padding:4,
            }}
          >
            <span style={{ display:'block', width:22, height:2, background:'#333', borderRadius:2 }}/>
            <span style={{ display:'block', width:22, height:2, background:'#333', borderRadius:2 }}/>
            <span style={{ display:'block', width:22, height:2, background:'#333', borderRadius:2 }}/>
          </button>
        </div>
      </nav>

      {/* ════════════════════ MOBILE MENU OVERLAY ════════════════════ */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          style={{ position:'fixed', inset:0, zIndex:2000, display:'flex' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setMobileMenuOpen(false); setMobileSubMenu(null); } }}
        >
          {/* Backdrop */}
          <div
            style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }}
            onClick={() => { setMobileMenuOpen(false); setMobileSubMenu(null); }}
          />

          {/* Panel */}
          <div style={{
            position:'relative', width:320, maxWidth:'85vw', height:'100%',
            background:'white', boxShadow:'4px 0 40px rgba(0,0,0,0.18)',
            display:'flex', flexDirection:'column', animation:'slideInLeft .22s ease',
            zIndex:1,
          }}>
            {/* Panel header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderBottom:'1px solid #f0f0f0' }}>
              {mobileSubMenu ? (
                <button
                  onClick={() => setMobileSubMenu(null)}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontSize:15, fontWeight:700, color:'#333', fontFamily:'inherit', padding:0 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  {mobileSubMenu.label}
                </button>
              ) : (
                <span style={{ fontSize:15, fontWeight:800, color:'#222' }}>Xin chào, Khách</span>
              )}
              <button
                onClick={() => { setMobileMenuOpen(false); setMobileSubMenu(null); }}
                style={{ background:'#f4f4f5', border:'none', width:32, height:32, borderRadius:'50%', fontSize:18, cursor:'pointer', color:'#666', display:'flex', alignItems:'center', justifyContent:'center' }}
              >
                ×
              </button>
            </div>

            {/* Panel body */}
            <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
              {!mobileSubMenu ? (
                // Main menu — top-level nav items
                <>
                  {NAV.map((navItem) => (
                    <MobileMenuItem
                      key={navItem.label}
                      label={navItem.label}
                      hasChildren={true}
                      onClick={() => setMobileSubMenu(navItem)}
                    />
                  ))}
                  <div style={{ height:1, background:'#f0f0f0', margin:'8px 20px' }} />
                  <MobileMenuItem label="Đăng nhập" onClick={() => openAuth('login')} />
                  <MobileMenuItem label="Đăng ký miễn phí" onClick={() => openAuth('register')} highlight />
                </>
              ) : (
                // Sub-menu: flat list of items, NO dropdown — tap directly triggers action
                <>
                  {mobileSubMenu.items.map((item) => (
                    <div
                      key={item.label}
                      onClick={() => handleMobileSubItemClick(mobileSubMenu)}
                      style={{ padding:'14px 20px', cursor:'pointer', borderBottom:'1px solid #f9f9f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = RL}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize:15, fontWeight:700, color:'#222', marginBottom:3 }}>{item.label}</div>
                      <div style={{ fontSize:13, color:'#aaa' }}>{item.sub}</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Panel footer */}
            <div style={{ padding:'16px 20px', borderTop:'1px solid #f0f0f0', fontSize:12, color:'#bbb', textAlign:'center' }}>
              © 2026 IELTS Instructor · ieltsinstructor.vn
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ HERO ════════════════════ */}
      <section style={{
        background:HERO_BG, minHeight:'100vh', paddingTop:68,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        textAlign:'center', padding:'120px 40px 80px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:100, right:'10%', width:170, height:170, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,.18) 0%, transparent 70%)', animation:'floatUp 4s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:120, left:'7%', width:110, height:110, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,.13) 0%, transparent 70%)', animation:'floatSlow 5s ease-in-out infinite 1s' }} />
        <div style={{ position:'absolute', top:'42%', right:'6%', width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,.14)', animation:'floatSlow 3s ease-in-out infinite .5s' }} />

        <div style={{
          display:'inline-flex', alignItems:'center', gap:7,
          background:'rgba(255,255,255,.18)', backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,.3)', borderRadius:50, padding:'6px 20px',
          marginBottom:28, color:'white', fontSize:13, fontWeight:600
        }}>
          Vô vàn học viên ghé thăm luyện tập mỗi ngày
        </div>

        <h1 style={{
          color:'white', fontWeight:900, lineHeight:1.12,
          fontSize:'clamp(40px, 6.5vw, 70px)', maxWidth:820, marginBottom:22,
          textShadow:'0 2px 30px rgba(0,0,0,.18)', letterSpacing:'-1.5px'
        }}>
          Nền tảng tự{' '}
          <span style={{ color:'transparent', WebkitTextStroke:'2.5px rgba(255,255,255,.85)' }}>Học</span>
          <br />và Luyện thi thế hệ mới
        </h1>

        <p style={{ color:'rgba(255,255,255,.82)', fontSize:17, maxWidth:440, marginBottom:46, lineHeight:1.8 }}>
          Chinh phục kì thi IELTS với bộ đề luyện tập độc quyền.
          Trợ lý ảo hỗ trợ 24/7, lộ trình cá nhân hóa.
        </p>

        <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
          <HeroBtn primary onClick={() => scrollTo(featuresRef)}>KHÁM PHÁ NGAY</HeroBtn>
          <HeroBtn onClick={() => scrollTo(contactRef)}>TƯ VẤN NGAY</HeroBtn>
        </div>

        <div style={{ display:'flex', gap:52, marginTop:68, flexWrap:'wrap', justifyContent:'center' }}>
          {[['300+','Đề luyện Reading'],['400+','Đề luyện Writing'],['4000+','Theo dõi MXH']].map(([n,l]) => (
            <div key={l} style={{ textAlign:'center', color:'white' }}>
              <div style={{ fontSize:34, fontWeight:900, letterSpacing:'-1px' }}>{n}</div>
              <div style={{ fontSize:13, opacity:.72, marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ ENTRANCE EXAM BANNER ════════════════════ */}
      <section ref={entranceRef} style={{ background: RL, padding: '80px 40px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'white', border: `1.5px solid rgba(220,38,38,.18)`,
            borderRadius: 50, padding: '5px 18px',
            marginBottom: 22, color: R, fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 12px rgba(220,38,38,.1)',
          }}>
            ✦ Hoàn toàn miễn phí
          </div>

          <h2 style={{
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900,
            color: '#111', marginBottom: 16, letterSpacing: '-.6px', lineHeight: 1.2,
          }}>
            Biết trình độ IELTS của bạn trong 60 phút
          </h2>

          <p style={{ color: '#555', fontSize: 17, lineHeight: 1.8, marginBottom: 12, maxWidth: 560, margin: '0 auto 12px' }}>
            Bài thi đầu vào miễn phí — 40 câu hỏi trắc nghiệm, kết quả ngay lập tức với ước tính Band IELTS chính xác.
          </p>

          <p style={{ color: '#999', fontSize: 14, marginBottom: 36 }}>
            Không cần thẻ tín dụng. Không cần cài đặt. Bắt đầu ngay bây giờ.
          </p>

          <button
            className="exam-cta-btn"
            onClick={() => {
              if (user) navigate('/entrance-exam');
              else openAuthWithRedirect('login', 'entrance-exam');
            }}
            style={{
              background: `linear-gradient(135deg,${R},${RD})`,
              color: 'white', border: 'none',
              padding: '16px 44px', borderRadius: 50,
              fontWeight: 800, fontSize: 16, cursor: 'pointer',
              boxShadow: `0 6px 24px rgba(220,38,38,.35)`,
              transition: 'all .22s', fontFamily: 'inherit', letterSpacing: '-.1px',
            }}
          >
            Làm bài thi đầu vào miễn phí →
          </button>
        </div>
      </section>

      {/* ════════════════════ FEATURES ════════════════════ */}
      <section ref={featuresRef} style={{ background:'#f7f8fc', padding:'90px 60px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:40, marginBottom:60, flexWrap:'wrap' }}>
            <h2 style={{ fontSize:'clamp(26px,3.2vw,42px)', fontWeight:900, color:'#111', maxWidth:520, lineHeight:1.25, letterSpacing:'-.8px' }}>
              Tinh thông mọi kĩ năng tiếng Anh với bộ chương trình đào tạo chất lượng
            </h2>
            <p style={{ color:'#888', maxWidth:320, lineHeight:1.8, fontSize:15, paddingTop:6 }}>
              Học tiếng Anh thật dễ dàng với lộ trình Học &amp; Luyện Thi toàn diện, được cá nhân hóa cho từng người.
            </p>
          </div>

          <div style={{ display:'flex', gap:18, overflowX:'auto', paddingBottom:12 }}>
            {[
              { title:'IELTS Reading', desc:'300 bài đọc theo bộ chủ đề lớn. Câu hỏi đa dạng — MCQ, T/F/NG, Matching, Short answer.',  bg:'linear-gradient(145deg,#1D4ED8,#1E3A8A)' },
              { title:'IELTS Writing', desc:'Task 1 biểu đồ & Task 2 luận với hướng dẫn mẫu và trợ lý ảo hỗ trợ 24/7.',            bg:`linear-gradient(145deg,${R},${RD})` },
              { title:'Gói Free',      desc:'10 bài đọc cơ bản, trợ lý ảo Writing 2 lần/tháng và bài kiểm tra đầu vào. Bắt đầu hoàn toàn miễn phí.', bg:'linear-gradient(145deg,#059669,#065F46)' },
              { title:'Gói Premium',   desc:'Toàn bộ 300+ bài đọc, trợ lý ảo hỗ trợ 24/7, đề thi thật và lộ trình cá nhân hóa.',  bg:'linear-gradient(145deg,#D97706,#92400E)' },
            ].map(c => <SkillCard key={c.title} {...c} onExplore={() => openAuth('register')} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════ PRICING ════════════════════ */}
      <section style={{ background:'white', padding:'90px 60px' }}>
        <div style={{ maxWidth:880, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-block', background:RL, color:R, padding:'5px 16px', borderRadius:50, fontSize:13, fontWeight:700, marginBottom:14, letterSpacing:'.5px' }}>
            BẢNG GIÁ
          </div>
          <h2 style={{ fontSize:'clamp(26px,3vw,40px)', fontWeight:900, color:'#111', marginBottom:12, letterSpacing:'-.5px' }}>
            Chọn gói học phù hợp với bạn
          </h2>
          <p style={{ color:'#888', fontSize:16, marginBottom:56 }}>Bắt đầu miễn phí — nâng cấp khi sẵn sàng chinh phục.</p>
          <div style={{ display:'flex', gap:24, justifyContent:'center', flexWrap:'wrap' }}>
            <PricingCard
              title="Gói Free" price="0đ" highlight={false}
              features={['10 bài đọc cơ bản','AI chấm chữa 2 lần/ tháng','Bài kiểm tra đầu vào','Không giới hạn thời gian']}
              cta="Bắt đầu miễn phí" onCta={() => openAuth('register')}
            />
            <PricingCard
              title="Gói Premium" price="99.000đ" originalPrice="299.000đ" badge="Lựa chọn phổ biến" highlight={true}
              features={['Toàn bộ 300+ bài đọc','Writing Task 1 & 2 đầy đủ','AI chấm điểm tức thì','Bảng giữ chuỗi kèm thưởng','Hỗ trợ ưu tiên 24/7','Cập nhật đề mới hàng tuần']}
              cta="Mua ngay" onCta={() => openAuth('register')}
            />
          </div>
        </div>
      </section>

      {/* ════════════════════ CONTACT ════════════════════ */}
      <section style={{ background:'#f7f8fc', padding:'60px 20px' }} ref={contactRef}>
        <div style={{
          maxWidth:1100, margin:'0 auto',
          background:HERO_BG, borderRadius:28, padding:'48px 32px',
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, opacity:.06, pointerEvents:'none',
            backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize:'40px 40px' }} />

          <div className="contact-grid" style={{ display:'flex', gap:48, alignItems:'flex-start', flexWrap:'wrap', position:'relative' }}>
            {/* Info col */}
            <div className="contact-info-col" style={{ flex:'1 1 220px', color:'white', minWidth:0 }}>
              <h2 style={{ fontSize:'clamp(24px,3vw,40px)', fontWeight:900, lineHeight:1.25, marginBottom:16, letterSpacing:'-.5px' }}>
                Bạn còn<br />câu hỏi khác?
              </h2>
              <p style={{ opacity:.82, lineHeight:1.8, fontSize:15 }}>
                Hãy để lại thông tin, IELTS Instructor sẽ liên hệ và hỗ trợ xử lý mọi vướng mắc của bạn.
              </p>
              <div style={{ marginTop:28, display:'flex', flexDirection:'column', gap:12 }}>
                {['Tư vấn lộ trình miễn phí','Phản hồi trong 24h','Hỗ trợ 1-1 tận tình'].map(t => (
                  <div key={t} style={{ color:'rgba(255,255,255,.9)', fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ color:'white', fontWeight:800 }}>✓</span>{t}
                  </div>
                ))}
              </div>
            </div>

            {/* Form col */}
            {sent ? (
              <div className="contact-form-col" style={{ flex:'1 1 300px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, minHeight:240 }}>
                <div style={{ fontSize:48 }}>✅</div>
                <h3 style={{ color:'white', fontWeight:900, fontSize:22 }}>Đã gửi thành công!</h3>
                <p style={{ color:'rgba(255,255,255,.8)', textAlign:'center', lineHeight:1.6 }}>
                  IELTS Instructor sẽ liên hệ với bạn trong vòng 24 giờ.<br/>
                  Kiểm tra email để nhận xác nhận.
                </p>
                <button onClick={() => { setSent(false); setForm({ name:'', phone:'', dob:'', email:'', role:'', course:'', msg:'' }); }}
                  style={{ marginTop:8, background:'white', color:R, border:'none', padding:'10px 24px', borderRadius:50, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>
                  Gửi lại
                </button>
              </div>
            ) : (
              <div className="contact-form-col" style={{ flex:'1 1 300px', display:'flex', flexDirection:'column', gap:12, minWidth:0 }}>
                <ContactField label="Họ và tên (*)" placeholder="Nhập họ và tên của bạn"
                  value={form.name}  onChange={v => setForm(f => ({...f, name:v}))} />
                <ContactField label="Số điện thoại (*)" placeholder="09x xxx xxxx" prefix="+84"
                  value={form.phone} onChange={v => setForm(f => ({...f, phone:v}))} />

                {/* FIX: added className for responsive override at 480px */}
                <div className="contact-dob-email-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <ContactField label="Năm sinh" placeholder="VD: 2000"
                    value={form.dob}   onChange={v => setForm(f => ({...f, dob:v}))} />
                  <ContactField label="Email" placeholder="Địa chỉ email"
                    value={form.email} onChange={v => setForm(f => ({...f, email:v}))} />
                </div>

                <ContactSelect label="Bạn là" options={['Học sinh THPT','Sinh viên đại học','Người đi làm','Khác']}
                  value={form.role}   onChange={v => setForm(f => ({...f, role:v}))} />
                <ContactSelect label="Khóa học bạn quan tâm (*)" options={['Gói Free','Gói Premium']}
                  value={form.course} onChange={v => setForm(f => ({...f, course:v}))} />
                <div>
                  <label style={{ color:'rgba(255,255,255,.85)', fontSize:13, fontWeight:600, display:'block', marginBottom:7 }}>Nội dung</label>
                  <textarea rows={3}
                    placeholder={"Bạn có câu hỏi gì?\n• Trình độ hiện tại của bạn\n• Mục tiêu mong muốn"}
                    value={form.msg} onChange={e => setForm(f => ({...f, msg:e.target.value}))}
                    style={{ width:'100%', borderRadius:12, border:'1.5px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.13)', color:'white', padding:'12px 14px', fontSize:14, resize:'vertical', fontFamily:'inherit', backdropFilter:'blur(4px)' }}
                  />
                </div>
                <p style={{ color:'rgba(255,255,255,.55)', fontSize:11, fontStyle:'italic' }}>
                  Bằng việc gửi đăng ký tư vấn, bạn đã đồng ý với Chính sách bảo mật thông tin của IELTS Instructor.
                </p>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <button onClick={handleContactSend} disabled={sending} className="cta-btn"
                    style={{
                      background:'white', color:R, border:'none',
                      padding:'13px 30px', borderRadius:50, fontWeight:800, fontSize:15,
                      cursor: sending ? 'wait' : 'pointer',
                      display:'flex', alignItems:'center', gap:8,
                      boxShadow:'0 4px 18px rgba(0,0,0,.18)', transition:'all .2s', fontFamily:'inherit',
                      opacity: sending ? 0.8 : 1,
                    }}
                  >
                    {sending ? (
                      <><span style={{ width:16, height:16, border:'2px solid rgba(220,38,38,.3)', borderTop:`2px solid ${R}`, borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />Đang gửi...</>
                    ) : 'Gửi câu hỏi →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#111', color:'#888', textAlign:'center', padding:'22px', fontSize:13 }}>
        © 2026 IELTS Instructor ·{' '}
        <a href="https://ieltsinstructor.vn" style={{ color:R, textDecoration:'none' }}>ieltsinstructor.vn</a>
      </footer>

      {/* ════════════════════ AUTH MODAL ════════════════════ */}
      {showAuth && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, animation:'fadeIn .2s ease', padding:'16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAuth(false); }}
        >
          <div style={{ background:'white', borderRadius:24, padding:'40px', width:'100%', maxWidth:420, boxShadow:'0 24px 80px rgba(0,0,0,.35)', animation:'scaleIn .22s ease', position:'relative' }}>
            <button onClick={() => setShowAuth(false)}
              style={{ position:'absolute', top:16, right:16, background:'#f4f4f5', border:'none', width:30, height:30, borderRadius:'50%', fontSize:17, cursor:'pointer', color:'#777', display:'flex', alignItems:'center', justifyContent:'center' }}>
              ×
            </button>
            <div style={{ textAlign:'center', marginBottom:26 }}>
              <img src="/ielts-logo.png" alt="IELTS Instructor" style={{ height:32, width:'auto', display:'inline-block' }} />
            </div>
            <div style={{ display:'flex', background:'#f4f4f5', borderRadius:14, padding:4, marginBottom:26 }}>
              {[{ id:'login', label:'Đăng nhập' },{ id:'register', label:'Đăng ký' }].map(t => (
                <button key={t.id} onClick={() => setAuthTab(t.id)}
                  style={{ flex:1, padding:'11px 0', border:'none', borderRadius:11, cursor:'pointer', fontWeight:700, fontSize:14, transition:'all .2s', fontFamily:'inherit', background:authTab===t.id ? 'white' : 'transparent', color:authTab===t.id ? '#111' : '#999', boxShadow:authTab===t.id ? '0 2px 10px rgba(0,0,0,.1)' : 'none' }}
                >{t.label}</button>
              ))}
            </div>
            <AuthForm tab={authTab} onClose={() => setShowAuth(false)} redirect={authRedirect} />
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Mobile menu item
function MobileMenuItem({ label, hasChildren, onClick, highlight }) {
  return (
    <div
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'15px 20px', cursor:'pointer',
        borderBottom:'1px solid #f5f5f5',
        background: highlight ? RL : 'transparent',
        transition:'background .15s',
      }}
      onMouseEnter={e => { if (!highlight) e.currentTarget.style.background = '#fafafa'; }}
      onMouseLeave={e => { if (!highlight) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize:15, fontWeight: highlight ? 800 : 600, color: highlight ? R : '#222' }}>{label}</span>
      {hasChildren && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function NavDropdown({ label, items, open, onToggle, onClose, onItemClick }) {
  return (
    <div data-nav-item style={{ position:'relative' }}>
      <button onClick={onToggle} style={{
        background:open ? RL : 'transparent', border:'none',
        padding:'9px 16px', borderRadius:10, cursor:'pointer',
        fontSize:15, fontWeight:600, color:open ? R : '#444',
        display:'flex', alignItems:'center', gap:5, transition:'all .18s', fontFamily:'inherit'
      }}>
        {label}
        <svg style={{ width:10, height:7, fill:'currentColor', transform:open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }} viewBox="0 0 10 7"><path d="M0 0l5 7 5-7z"/></svg>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, background:'white', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,.13), 0 0 0 1px rgba(0,0,0,.04)', minWidth:255, overflow:'hidden', animation:'fadeSlideDown .15s ease', zIndex:1001, padding:'6px 0' }}>
          {items.map(({ label:lbl, sub }) => (
            <DropItem key={lbl} label={lbl} sub={sub} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function DropItem({ label, sub, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ padding:'11px 18px', cursor:'pointer', background:hov ? RL : 'transparent', transition:'background .15s' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      <div style={{ fontSize:14, fontWeight:600, color:hov ? R : '#222' }}>{label}</div>
      <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{sub}</div>
    </div>
  );
}

function HeroBtn({ children, onClick, primary }) {
  const [hov, setHov] = useState(false);
  return (
    <button className="cta-btn" onClick={onClick}
      style={{
        background:primary ? 'white' : (hov ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.1)'),
        color:primary ? R : 'white',
        border:primary ? 'none' : '2px solid rgba(255,255,255,.65)',
        padding:'15px 38px', borderRadius:50, fontWeight:800, fontSize:15, cursor:'pointer',
        letterSpacing:'.3px', fontFamily:'inherit',
        boxShadow:primary ? '0 4px 20px rgba(0,0,0,.18)' : 'none',
        transition:'all .22s', backdropFilter:!primary ? 'blur(4px)' : 'none',
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >{children}</button>
  );
}

function SkillCard({ title, desc, bg, onExplore }) {
  return (
    <div className="skill-card"
      style={{ background:bg, borderRadius:22, padding:'30px 26px', minWidth:220, flex:'1 1 200px', color:'white', display:'flex', flexDirection:'column', gap:14, transition:'all .3s ease', cursor:'default', boxShadow:'0 8px 24px rgba(0,0,0,.1)' }}>
      <h3 style={{ fontSize:20, fontWeight:800, letterSpacing:'-.3px' }}>{title}</h3>
      <p style={{ fontSize:14, lineHeight:1.7, opacity:.88, flexGrow:1 }}>{desc}</p>
      <button className="explore-btn" onClick={onExplore}
        style={{ alignSelf:'flex-start', background:'rgba(255,255,255,.18)', border:'2px solid rgba(255,255,255,.45)', color:'white', borderRadius:50, padding:'8px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all .2s', marginTop:4, letterSpacing:'.2px' }}>
        Khám phá ngay
      </button>
    </div>
  );
}

function PricingCard({ title, price, originalPrice, badge, features, cta, onCta, highlight }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="pricing-card"
      style={{ flex:'1 1 300px', maxWidth:380, border:highlight ? `2px solid ${R}` : '2px solid #e9eaf0', borderRadius:24, padding:'38px 32px', background:highlight ? '#FFF5F5' : 'white', position:'relative', boxShadow:highlight ? (hov ? '0 22px 60px rgba(220,38,38,.22)' : '0 8px 30px rgba(220,38,38,.12)') : (hov ? '0 12px 40px rgba(0,0,0,.1)' : '0 4px 16px rgba(0,0,0,.05)'), transition:'all .3s ease' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {badge && (
        <div style={{ position:'absolute', top:-15, left:'50%', transform:'translateX(-50%)', background:`linear-gradient(135deg,${R},${RD})`, color:'white', padding:'5px 18px', borderRadius:50, fontSize:12, fontWeight:800, whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(220,38,38,.35)' }}>{badge}</div>
      )}
      <h3 style={{ fontSize:18, fontWeight:800, color:'#222', marginBottom:10 }}>{title}</h3>
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:28 }}>
        {originalPrice && <span style={{ color:'#bbb', textDecoration:'line-through', fontSize:15 }}>{originalPrice}</span>}
        <span style={{ fontSize:38, fontWeight:900, color:highlight ? R : '#111', letterSpacing:'-1px' }}>{price}</span>
        {price !== '0đ' && <span style={{ color:'#aaa', fontSize:13 }}>/tháng</span>}
      </div>
      <ul style={{ listStyle:'none', marginBottom:32, display:'flex', flexDirection:'column', gap:12 }}>
        {features.map(f => (
          <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, color:'#555' }}>
            <span style={{ color:R, fontWeight:800, flexShrink:0, fontSize:15 }}>✓</span>{f}
          </li>
        ))}
      </ul>
      <button onClick={onCta}
        style={{ width:'100%', padding:'14px 0', borderRadius:50, background:highlight ? `linear-gradient(135deg,${R},${RD})` : 'transparent', color:highlight ? 'white' : R, border:highlight ? 'none' : `2px solid ${R}`, fontWeight:800, fontSize:15, cursor:'pointer', transition:'all .2s', fontFamily:'inherit', boxShadow:highlight ? '0 4px 16px rgba(220,38,38,.3)' : 'none' }}
      >{cta}</button>
    </div>
  );
}

function ContactField({ label, placeholder, prefix, value, onChange, style }) {
  return (
    <div style={{ ...style, minWidth:0 }}>
      <label style={{ color:'rgba(255,255,255,.85)', fontSize:13, fontWeight:600, display:'block', marginBottom:7 }}>{label}</label>
      <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,.14)', borderRadius:12, border:'1.5px solid rgba(255,255,255,.25)', overflow:'hidden', backdropFilter:'blur(4px)' }}>
        {prefix && <span style={{ color:'rgba(255,255,255,.8)', padding:'0 12px', fontSize:14, fontWeight:700, borderRight:'1px solid rgba(255,255,255,.2)', whiteSpace:'nowrap' }}>{prefix}</span>}
        <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
          style={{ flex:1, background:'transparent', border:'none', color:'white', padding:'12px 14px', fontSize:14, fontFamily:'inherit', minWidth:0 }}/>
      </div>
    </div>
  );
}

function ContactSelect({ label, options, value, onChange }) {
  return (
    <div>
      <label style={{ color:'rgba(255,255,255,.85)', fontSize:13, fontWeight:600, display:'block', marginBottom:7 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', background:'rgba(255,255,255,.14)', color:value ? 'white' : 'rgba(255,255,255,.5)', border:'1.5px solid rgba(255,255,255,.25)', borderRadius:12, padding:'12px 14px', fontSize:14, fontFamily:'inherit', backdropFilter:'blur(4px)' }}>
        <option value="" style={{ color:'#333' }}>Lựa chọn</option>
        {options.map(o => <option key={o} value={o} style={{ color:'#333' }}>{o}</option>)}
      </select>
    </div>
  );
}

// ── AUTH FORM ──────────────────────────────────────────────────────────────────
function AuthForm({ tab, onClose, redirect }) {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [fullName,  setFullName]  = useState('');
  const [targetBand, setTargetBand] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) { setError('Vui lòng nhập email và mật khẩu!'); return; }
    setLoading(true); setError('');
    try {
      await signIn({ email, password });
      onClose();
      navigate(redirect ? `/${redirect}` : '/dashboard');
    } catch (e) {
      setError(e.message === 'Invalid login credentials'
        ? 'Email hoặc mật khẩu không đúng.'
        : e.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password || !fullName) { setError('Vui lòng điền đầy đủ thông tin!'); return; }
    if (password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return; }
    setLoading(true); setError('');
    try {
      await signUp({ email, password, fullName, targetBand });
      setSuccess('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ textAlign:'center', padding:'8px 0' }}>
      <div style={{ fontSize:44, marginBottom:12 }}>📬</div>
      <h3 style={{ fontWeight:800, fontSize:17, color:'#111', marginBottom:8 }}>Kiểm tra email của bạn</h3>
      <p style={{ fontSize:13, color:'#888', lineHeight:1.7, marginBottom:20 }}>{success}</p>
      <button onClick={() => setSuccess('')}
        style={{ background:`linear-gradient(135deg,${R},${RD})`, color:'white', border:'none', padding:'11px 28px', borderRadius:50, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:14 }}>
        Về đăng nhập
      </button>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {tab === 'register' && (
        <FocusInput label="Họ và tên" placeholder="Nguyễn Văn A" type="text" value={fullName} onChange={setFullName} />
      )}
      <FocusInput label="Email" placeholder="email@cua.ban" type="email" value={email} onChange={setEmail} />
      <FocusInput label="Mật khẩu" placeholder={tab === 'register' ? 'Tối thiểu 8 ký tự' : 'Mật khẩu của bạn'} type="password" value={password} onChange={setPassword} />
      {tab === 'register' && (
        <div>
          <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:7 }}>Band mục tiêu (không bắt buộc)</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['6.0','6.5','7.0','7.5','8.0+'].map(b => (
              <button key={b} onClick={() => setTargetBand(targetBand === b ? '' : b)}
                style={{ padding:'6px 14px', borderRadius:20, fontSize:13, border:`1.5px solid ${targetBand===b ? R : '#e5e7eb'}`, background: targetBand===b ? RL : '#fff', color: targetBand===b ? R : '#555', cursor:'pointer', fontFamily:'inherit' }}>
                {b}
              </button>
            ))}
          </div>
        </div>
      )}
      {tab === 'login' && (
        <div style={{ textAlign:'right', marginTop:-6 }}>
          <a href="#" style={{ fontSize:13, color:R, textDecoration:'none', fontWeight:600 }}>Quên mật khẩu?</a>
        </div>
      )}
      {error && (
        <div style={{ fontSize:13, color:'#EF4444', background:'#FEF2F2', padding:'10px 14px', borderRadius:10 }}>
          {error}
        </div>
      )}
      <button
        onClick={tab === 'login' ? handleLogin : handleRegister}
        disabled={loading}
        style={{
          background: loading ? '#9CA3AF' : `linear-gradient(135deg,${R},${RD})`,
          color:'white', border:'none', padding:'15px 0', borderRadius:14,
          fontWeight:800, fontSize:16, cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 18px rgba(220,38,38,.3)',
          marginTop:4, fontFamily:'inherit', transition:'all .2s',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}
      >
        {loading
          ? <><Spinner />{tab === 'login' ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...'}</>
          : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản miễn phí'
        }
      </button>
      <p style={{ textAlign:'center', fontSize:12, color:'#bbb', marginTop:4 }}>© 2026 IELTS Instructor · ieltsinstructor.vn</p>
    </div>
  );
}

function FocusInput({ label, placeholder, type = 'text', value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize:13, fontWeight:700, color:'#555', display:'block', marginBottom:7 }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', padding:'12px 14px', borderRadius:12, fontSize:14, fontFamily:'inherit',
          border: focused ? `2px solid ${R}` : '2px solid #e9eaf0',
          outline:'none', transition:'border .18s', color:'#222', background:'#fafafa',
          boxSizing:'border-box',
        }}
      />
    </div>
  );
}

function Spinner() {
  return (
    <span style={{ width:18, height:18, border:'3px solid rgba(255,255,255,.3)', borderTop:'3px solid white', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />
  );
}
