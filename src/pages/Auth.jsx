import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { signIn, signUp, resetPassword } from '../lib/auth'
import { getLatestExamResult } from '../lib/examResults'

const BAND_OPTIONS = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5+']

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [screen, setScreen] = useState(mode)

  const [form, setForm] = useState({ fullName: '', email: '', password: '', targetBand: '6.5', agree: false })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setScreen(mode) }, [mode])

  const redirectAfterAuth = async (userId) => {
    const redirectTo = searchParams.get('redirect')
    if (redirectTo === 'entrance-exam') {
      navigate('/entrance-exam')
      return
    }
    try {
      const result = await getLatestExamResult(userId)
      if (result === null) {
        navigate('/entrance-exam')
      } else {
        navigate('/dashboard')
      }
    } catch {
      navigate('/dashboard')
    }
  }

  const passwordStrength = (p) => {
    if (!p) return { label: '', color: '', width: 0 }
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    const levels = [
      { label: 'Yếu', color: 'bg-red-500', width: 25 },
      { label: 'Trung bình', color: 'bg-orange-400', width: 50 },
      { label: 'Khá', color: 'bg-yellow-400', width: 75 },
      { label: 'Mạnh', color: 'bg-green-500', width: 100 },
    ]
    return levels[Math.min(score, 3)]
  }

  const strength = passwordStrength(form.password)

  // ── FIX: truyền object thay vì positional args ──
  const handleLogin = async () => {
    setError(''); setLoading(true)
    try {
      const { user } = await signIn({ email: form.email, password: form.password })
      await redirectAfterAuth(user.id)
    } catch (e) {
      setError('Email hoặc mật khẩu không đúng.')
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    if (!form.agree) { setError('Bạn cần đồng ý với điều khoản.'); return }
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return }
    setError(''); setLoading(true)
    try {
      const { user } = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        targetBand: form.targetBand,
      })
      if (user) {
        await redirectAfterAuth(user.id)
      } else {
        setScreen('verify')
      }
    } catch (e) {
      setError(e.message || 'Đăng ký thất bại. Thử lại.')
    } finally { setLoading(false) }
  }

  const handleForgot = async () => {
    setError(''); setLoading(true)
    try {
      await resetPassword(form.email)
      setScreen('forgotDone')
    } catch (e) {
      setError('Không tìm thấy email này.')
    } finally { setLoading(false) }
  }

  const leftPanel = {
    login: { title: 'Chào mừng trở lại!', sub: 'Tiếp tục hành trình IELTS của bạn.', quote: '"Mỗi ngày học là một bước gần hơn đến band 7.0+"', stats: ['4000+ người theo dõi MXH', 'Tự chủ quá trình học bản thân', 'Trợ lý ảo hỗ trợ 24/7'] },
    register: { title: 'Bắt đầu miễn phí', sub: 'Tạo tài khoản và học ngay hôm nay.', quote: '"AI chấm bài, bạn chỉ cần tập trung học."', stats: ['Người bạn luyện viết đồng hành', 'Bất kể ngày đêm', 'Streak hàng ngày'] },
    forgot: { title: 'Quên mật khẩu?', sub: 'Nhập email để nhận link đặt lại.', quote: '"Không sao, chúng tôi luôn ở đây giúp bạn."', stats: [] },
  }

  const panel = leftPanel[screen] || leftPanel.login

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel */}
      <div className="hidden md:flex md:w-5/12 bg-red-700 text-white flex-col justify-between p-10">
        <div className="text-xl font-bold">IELTS Instructor</div>
        <div>
          <h2 className="text-3xl font-bold mb-3">{panel.title}</h2>
          <p className="text-red-100 mb-6">{panel.sub}</p>
          <p className="italic text-red-200 text-sm mb-8">{panel.quote}</p>
          <div className="flex flex-col gap-2">
            {panel.stats.map(s => <span key={s} className="text-sm bg-red-800 px-3 py-1 rounded-full w-fit">✅ {s}</span>)}
          </div>
        </div>
        <p className="text-xs text-red-300">© 2025 IELTS Instructor</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">

          {/* VERIFY */}
          {screen === 'verify' && (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-bold mb-2">Kiểm tra email của bạn</h2>
              <p className="text-gray-500 text-sm mb-6">Chúng tôi đã gửi link xác minh đến <strong>{form.email}</strong>. Nhấn vào link để kích hoạt tài khoản.</p>
              <button onClick={() => setScreen('login')} className="text-red-700 text-sm hover:underline">← Quay lại đăng nhập</button>
            </div>
          )}

          {/* FORGOT DONE */}
          {screen === 'forgotDone' && (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold mb-2">Đã gửi link đặt lại</h2>
              <p className="text-gray-500 text-sm mb-6">Kiểm tra hộp thư của <strong>{form.email}</strong></p>
              <button onClick={() => navigate('/auth')} className="text-red-700 text-sm hover:underline">← Quay lại đăng nhập</button>
            </div>
          )}

          {/* FORGOT */}
          {screen === 'forgot' && (
            <>
              <h2 className="text-xl font-bold mb-1">Quên mật khẩu</h2>
              <p className="text-gray-400 text-sm mb-6">Nhập email tài khoản của bạn</p>
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>}
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-red-500" />
              <button onClick={handleForgot} disabled={loading}
                className="w-full bg-red-700 text-white py-2.5 rounded-lg font-semibold hover:bg-red-800 disabled:opacity-60">
                {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
              </button>
              <button onClick={() => setScreen('login')} className="mt-4 text-sm text-gray-400 hover:text-gray-600 block mx-auto">← Quay lại đăng nhập</button>
            </>
          )}

          {/* LOGIN */}
          {screen === 'login' && (
            <>
              <h2 className="text-xl font-bold mb-1">Đăng nhập</h2>
              <p className="text-gray-400 text-sm mb-6">Chào mừng trở lại</p>
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>}
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-red-500" />
              <div className="relative mb-1">
                <input type={showPass ? 'text' : 'password'} placeholder="Mật khẩu" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400 text-sm">{showPass ? 'Ẩn' : 'Hiện'}</button>
              </div>
              <div className="text-right mb-4">
                <button onClick={() => setScreen('forgot')} className="text-xs text-red-600 hover:underline">Quên mật khẩu?</button>
              </div>
              <button onClick={handleLogin} disabled={loading}
                className="w-full bg-red-700 text-white py-2.5 rounded-lg font-semibold hover:bg-red-800 disabled:opacity-60">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <p className="text-center text-sm text-gray-400 mt-4">
                Chưa có tài khoản?{' '}
                <button onClick={() => setScreen('register')} className="text-red-700 font-semibold hover:underline">Đăng ký miễn phí</button>
              </p>
            </>
          )}

          {/* REGISTER */}
          {screen === 'register' && (
            <>
              <h2 className="text-xl font-bold mb-1">Tạo tài khoản</h2>
              <p className="text-gray-400 text-sm mb-5">Miễn phí, không cần thẻ tín dụng</p>
              {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>}
              <input type="text" placeholder="Họ và tên" value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-red-500" />
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-red-500" />
              <div className="relative mb-1">
                <input type={showPass ? 'text' : 'password'} placeholder="Mật khẩu" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400 text-sm">{showPass ? 'Ẩn' : 'Hiện'}</button>
              </div>
              {form.password && (
                <div className="mb-3">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all`} style={{ width: strength.width + '%' }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Độ mạnh: <span className="font-semibold">{strength.label}</span></p>
                </div>
              )}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-1 block">Band mục tiêu</label>
                <select value={form.targetBand} onChange={e => setForm(f => ({ ...f, targetBand: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500">
                  {BAND_OPTIONS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <label className="flex items-start gap-2 text-sm text-gray-500 mb-4 cursor-pointer">
                <input type="checkbox" checked={form.agree} onChange={e => setForm(f => ({ ...f, agree: e.target.checked }))} className="mt-0.5" />
                Tôi đồng ý với <span className="text-red-700 underline">Điều khoản dịch vụ</span> và <span className="text-red-700 underline">Chính sách bảo mật</span>
              </label>
              <button onClick={handleRegister} disabled={loading}
                className="w-full bg-red-700 text-white py-2.5 rounded-lg font-semibold hover:bg-red-800 disabled:opacity-60">
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản miễn phí'}
              </button>
              <p className="text-center text-sm text-gray-400 mt-4">
                Đã có tài khoản?{' '}
                <button onClick={() => setScreen('login')} className="text-red-700 font-semibold hover:underline">Đăng nhập</button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
