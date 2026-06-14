import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const R  = '#DC2626'
const RD = '#991B1B'
const RL = '#FEF2F2'
const GRAD = `linear-gradient(135deg, ${R}, ${RD})`

const BANK_ID      = 'VCB'
const ACCOUNT_NO   = '9906104665'
const ACCOUNT_NAME = 'HOANG THE PHONG'
const AMOUNT       = 99000

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function useCountdown(secs) {
  const [left, setLeft] = useState(secs)
  useEffect(() => {
    const t = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  const m = String(Math.floor(left / 60)).padStart(2, '0')
  const s = String(left % 60).padStart(2, '0')
  return { left, fmt: `${m}:${s}`, expired: left === 0 }
}

function GradBtn({ children, onClick, disabled, style = {} }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: disabled ? '#e5e7eb' : GRAD,
        color: disabled ? '#aaa' : '#fff',
        border: 'none',
        borderRadius: 12,
        padding: '14px 0',
        width: '100%',
        fontSize: 15,
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '-.1px',
        fontFamily: 'inherit',
        boxShadow: disabled ? 'none' : hov
          ? `0 8px 28px rgba(185,28,28,.55)`
          : `0 4px 18px rgba(185,28,28,.35)`,
        transform: !disabled && hov ? 'translateY(-2px)' : 'none',
        transition: 'all .2s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ── Steps indicator ───────────────────────────────────────────────────────────

function Steps({ current }) {
  const steps = ['Chọn gói', 'Thanh toán', 'Xác nhận']
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i <= current ? GRAD : '#e5e7eb',
              color: i <= current ? '#fff' : '#aaa',
              fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: i <= current ? `0 3px 10px rgba(185,28,28,.35)` : 'none',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 11, color: i <= current ? R : '#aaa', fontWeight: i === current ? 700 : 400, whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 56, height: 2, background: i < current ? GRAD : '#e5e7eb', margin: '0 6px', marginBottom: 18, borderRadius: 2 }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Plan ──────────────────────────────────────────────────────────────

function PlanStep({ profile, isPremium, onNext }) {
  const [hovFree, setHovFree] = useState(false)
  const [hovPrem, setHovPrem] = useState(false)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111', marginBottom: 6, letterSpacing: '-.5px' }}>Chọn gói học</h2>
        <p style={{ fontSize: 14, color: '#888' }}>Hủy bất cứ lúc nào. Không phí ẩn.</p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24, justifyContent: 'center' }}>

        {/* Free card */}
        <div
          onMouseEnter={() => setHovFree(true)}
          onMouseLeave={() => setHovFree(false)}
          style={{
            flex: '1 1 280px', maxWidth: 320,
            border: hovFree ? `2px solid ${R}` : '2px solid #e9eaf0',
            borderRadius: 24, padding: '38px 32px',
            background: hovFree ? RL : '#fff',
            boxShadow: hovFree ? `0 12px 40px rgba(220,38,38,.12)` : '0 4px 16px rgba(0,0,0,.05)',
            transition: 'all .25s ease',
            transform: hovFree ? 'translateY(-4px)' : 'none',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#222', marginBottom: 10 }}>Gói Free</h3>
          <div style={{ fontSize: 38, fontWeight: 900, color: '#111', letterSpacing: '-1px', marginBottom: 28 }}>0đ</div>
          <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['10 bài đọc cơ bản', 'AI chấm chữa 2 lần / tháng', 'Bài kiểm tra đầu vào', 'Không giới hạn thời gian'].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#555' }}>
                <span style={{ color: R, fontWeight: 800, flexShrink: 0 }}>✓</span>{f}
              </li>
            ))}
          </ul>
          {!isPremium
            ? <div style={{ textAlign: 'center', padding: '12px 0', border: `2px solid ${R}`, borderRadius: 50, color: R, fontWeight: 800, fontSize: 14 }}>Gói hiện tại</div>
            : null
          }
        </div>

        {/* Premium card */}
        <div
          onMouseEnter={() => setHovPrem(true)}
          onMouseLeave={() => setHovPrem(false)}
          style={{
            flex: '1 1 280px', maxWidth: 320,
            border: `2px solid ${R}`,
            borderRadius: 24, padding: '38px 32px',
            background: RL,
            position: 'relative',
            boxShadow: hovPrem ? `0 22px 60px rgba(220,38,38,.28)` : `0 8px 30px rgba(220,38,38,.14)`,
            transition: 'all .25s ease',
            transform: hovPrem ? 'translateY(-6px)' : 'none',
          }}
        >
          <div style={{
            position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)',
            background: GRAD, color: '#fff',
            padding: '5px 18px', borderRadius: 50,
            fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
            boxShadow: `0 4px 12px rgba(220,38,38,.35)`,
          }}>
            Lựa chọn phổ biến
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#222', marginBottom: 10 }}>Gói Premium</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 28 }}>
            <span style={{ color: '#bbb', textDecoration: 'line-through', fontSize: 15 }}>299.000đ</span>
            <span style={{ fontSize: 38, fontWeight: 900, color: R, letterSpacing: '-1px' }}>99.000đ</span>
            <span style={{ color: '#aaa', fontSize: 13 }}>/tháng</span>
          </div>
          <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Toàn bộ 300+ bài đọc',
              'Writing Task 1 & 2 đầy đủ',
              'AI chấm điểm tức thì',
              'Bảng giữ chuỗi kèm thưởng',
              'Hỗ trợ ưu tiên 24/7',
              'Cập nhật đề mới hàng tuần',
            ].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#333' }}>
                <span style={{ color: R, fontWeight: 800, flexShrink: 0 }}>✓</span>{f}
              </li>
            ))}
          </ul>
          {isPremium
            ? <div style={{ textAlign: 'center', padding: '12px 0', background: GRAD, borderRadius: 50, color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: `0 4px 14px rgba(185,28,28,.35)` }}>Gói hiện tại</div>
            : null
          }
        </div>
      </div>

      {profile?.streak_current >= 23 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          Bạn đang ở ngày <strong>{profile.streak_current}</strong> — còn {30 - profile.streak_current} ngày để nhận <strong>giảm 30%</strong>!
        </div>
      )}

      {isPremium ? (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 12, padding: '14px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#166534' }}>
          Bạn đang dùng gói Premium. Cảm ơn bạn đã tin tưởng IELTS Instructor!
        </div>
      ) : (
        <GradBtn onClick={onNext}>Tiếp tục thanh toán →</GradBtn>
      )}
    </div>
  )
}

// ── QR Modal ─────────────────────────────────────────────────────────────────

function QrModal({ src, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}
      >
        <img src={src} alt="QR thanh toán" width={280} height={280} style={{ borderRadius: 12, display: 'block' }} />
        <button
          onClick={onClose}
          style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: 50, padding: '10px 28px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 14px rgba(185,28,28,.35)` }}
        >
          Đóng
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Payment ───────────────────────────────────────────────────────────

function PaymentStep({ user, onNext, onBack }) {
  const { left, fmt, expired } = useCountdown(15 * 60)
  const [method, setMethod] = useState('qr')
  const [copied, setCopied] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [qrZoom, setQrZoom] = useState(false)

  const email = user?.email || ''
  const addInfo = encodeURIComponent(email)
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${AMOUNT}&addInfo=${addInfo}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
  const timerPct = (left / (15 * 60)) * 100

  const copy = (txt, key) => {
    navigator.clipboard?.writeText(txt).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const handleConfirm = () => {
    setConfirmed(true)
    setTimeout(() => onNext(), 1500)
  }

  const bankInfo = [
    { label: 'Ngân hàng',    val: 'Vietcombank (VCB)', key: '' },
    { label: 'Số tài khoản', val: ACCOUNT_NO, key: 'acc' },
    { label: 'Chủ tài khoản',val: ACCOUNT_NAME, key: '' },
    { label: 'Số tiền',      val: '99.000 VNĐ', key: '', bold: true, color: R },
    { label: 'Nội dung CK',  val: email, key: 'code', bold: true },
  ]

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {qrZoom && <QrModal src={qrUrl} onClose={() => setQrZoom(false)} />}

      <button onClick={onBack} style={{ fontSize: 14, color: '#888', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontFamily: 'inherit' }}>
        ← Quay lại
      </button>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left */}
        <div style={{ flex: '1 1 300px' }}>

          {/* Timer */}
          <div style={{
            background: expired ? '#FEF2F2' : '#FFFBEB',
            border: `1px solid ${expired ? '#FCA5A5' : '#F59E0B'}`,
            borderRadius: 12, padding: '10px 14px', marginBottom: 14,
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: expired ? '#991B1B' : '#92400E', fontWeight: 700 }}>
                {expired ? 'Phiên hết hạn, vui lòng quay lại' : `Phiên hết hạn sau ${fmt}`}
              </div>
              <div style={{ background: '#fff', borderRadius: 99, height: 4, marginTop: 5, overflow: 'hidden' }}>
                <div style={{ width: `${timerPct}%`, height: '100%', background: timerPct < 20 ? '#EF4444' : '#F59E0B', borderRadius: 99, transition: 'width 1s linear' }} />
              </div>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', color: expired ? '#EF4444' : '#92400E' }}>{fmt}</span>
          </div>

          {/* Method toggle */}
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12, padding: 4, gap: 4, marginBottom: 14 }}>
            {[['qr', 'Quét QR'], ['transfer', 'Chuyển khoản']].map(([id, lbl]) => (
              <button key={id} onClick={() => setMethod(id)}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700,
                  border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                  background: method === id ? '#fff' : 'transparent',
                  color: method === id ? R : '#888',
                  boxShadow: method === id ? '0 1px 6px rgba(0,0,0,.1)' : 'none',
                  transition: 'all .18s',
                }}
              >{lbl}</button>
            ))}
          </div>

          {/* QR panel */}
          {method === 'qr' ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Quét bằng app ngân hàng bất kỳ</p>
              <div
                onClick={() => setQrZoom(true)}
                title="Nhấn để phóng to"
                style={{
                  display: 'inline-flex', padding: 10,
                  background: '#fff', border: '2px solid #e5e7eb', borderRadius: 14,
                  marginBottom: 10, cursor: 'zoom-in',
                  transition: 'border-color .2s, box-shadow .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = R; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(220,38,38,.12)` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <img
                  src={qrUrl}
                  alt="VietQR thanh toán"
                  width={200} height={200}
                  style={{ display: 'block', borderRadius: 8 }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                />
                <div style={{ display: 'none', width: 200, height: 200, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#aaa', fontSize: 13 }}>
                  <span style={{ fontSize: 32 }}>—</span>
                  <span>Không tải được QR</span>
                  <span style={{ fontSize: 11 }}>Dùng tab chuyển khoản</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#777', marginTop: 4 }}>Nhấn QR để phóng to</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 12 }}>Thông tin chuyển khoản</p>
              {bankInfo.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < bankInfo.length - 1 ? '1px solid #f3f4f6' : 'none', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#888', flexShrink: 0 }}>{r.label}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 500, color: r.color || '#111', textAlign: 'right', wordBreak: 'break-all' }}>{r.val}</span>
                    {r.key && (
                      <button onClick={() => copy(r.val, r.key)}
                        style={{ fontSize: 11, color: copied === r.key ? '#22C55E' : R, background: copied === r.key ? '#DCFCE7' : RL, border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', fontWeight: 700 }}>
                        {copied === r.key ? 'Đã copy' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, background: RL, border: `1px solid rgba(185,28,28,.2)`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: RD, lineHeight: 1.6 }}>
                Nhập đúng nội dung <strong>{email}</strong> để admin xác nhận đúng tài khoản của bạn.
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ flex: '0 1 260px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Order summary */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#111' }}>Tóm tắt đơn hàng</p>
            {[['Gói Premium', '99.000đ'], ['Thời hạn', '1 tháng'], ['Tài khoản', email], ['Giảm giá', '200.000đ']].map(([l, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #f3f4f6', gap: 8 }}>
                <span style={{ color: '#888', flexShrink: 0 }}>{l}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 900, padding: '11px 0 0', color: '#111' }}>
              <span>Tổng</span>
              <span style={{ color: R }}>99.000đ</span>
            </div>
          </div>

          {/* Steps guide */}
          <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#333' }}>Hướng dẫn</p>
            {[
              'Chuyển đúng số tiền & nội dung',
              'Nhấn nút xác nhận bên dưới',
              'Admin duyệt trong vòng 24 giờ',
              'Nếu có thắc mắc vui lòng liên hệ Zalo: 0906104665',
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#555', marginBottom: 8 }}>
                <span style={{ color: R, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>{s}
              </div>
            ))}
          </div>

          <GradBtn
            onClick={handleConfirm}
            disabled={confirmed || expired}
          >
            {confirmed ? 'Đã ghi nhận!' : expired ? 'Phiên hết hạn' : 'Xác nhận chuyển khoản'}
          </GradBtn>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', lineHeight: 1.6 }}>
            Thanh toán qua <strong style={{ color: '#059669' }}>VietQR</strong><br />
            Hỗ trợ: <strong style={{ color: R }}>ieltsinstructor.vn</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Success ───────────────────────────────────────────────────────────

function SuccessStep({ onDone }) {
  const [count, setCount] = useState(5)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setCount(c => {
      if (c <= 1) { clearInterval(t); navigate('/dashboard') }
      return c - 1
    }), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32 }}>
        {/* checkmark SVG */}
        <svg viewBox="0 0 24 24" width={34} height={34} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', marginBottom: 8, letterSpacing: '-.4px' }}>Đã ghi nhận yêu cầu!</h2>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 1.7 }}>
        Admin sẽ xác nhận và kích hoạt Premium trong vòng <strong>24 giờ</strong> sau khi nhận được chuyển khoản.
      </p>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'left' }}>
        {[
          ['Gói', 'Premium'],
          ['Ngày yêu cầu', new Date().toLocaleDateString('vi-VN')],
          ['Trạng thái', 'Chờ xác nhận'],
        ].map(([l, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none', fontSize: 14 }}>
            <span style={{ color: '#888' }}>{l}</span>
            <span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
        Nếu sau 24 giờ chưa được kích hoạt, vui lòng liên hệ qua <strong>Zalo: 0906104665</strong>
      </div>

      <GradBtn onClick={() => navigate('/dashboard')} style={{ marginBottom: 8 }}>
        Về trang chủ →
      </GradBtn>
      <p style={{ fontSize: 12, color: '#aaa' }}>Tự động chuyển sau {count} giây</p>
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function Subscription({ user, profile, isPremium, setPage }) {
  const [step, setStep] = useState(0)

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-.3px' }}>Gói học</h2>
      </div>
      <Steps current={step} />
      {step === 0 && <PlanStep profile={profile} isPremium={isPremium} onNext={() => setStep(1)} />}
      {step === 1 && <PaymentStep user={user} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
      {step === 2 && <SuccessStep onDone={() => { setStep(0); setPage?.('dashboard') }} />}
    </div>
  )
}