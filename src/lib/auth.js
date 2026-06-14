import { supabase } from './supabase'

// ── Disposable email blocklist ─────────────────────────────────────────────
// Tổng hợp các domain phổ biến nhất tại VN + quốc tế
const DISPOSABLE_DOMAINS = new Set([
  // ── 10-minute / temp mail phổ biến ──
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'guerrillamail.biz','guerrillamail.de','guerrillamailblock.com',
  'tempmail.com','temp-mail.org','tempmail.net','tempmail.io',
  '10minutemail.com','10minutemail.net','10minutemail.org','10minutemail.co.uk',
  'throwaway.email','throwawemail.com','throwam.com',
  'yopmail.com','yopmail.fr','yopmail.net',
  'sharklasers.com','grr.la','guerrillamail.info',
  'spam4.me','spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'trashmail.com','trashmail.me','trashmail.net','trashmail.org',
  'trashmail.at','trashmail.io','trashmail.xyz',
  'dispostable.com','maildrop.cc','fakeinbox.com',
  'mailnull.com','spamex.com','mailexpire.com',
  'getairmail.com','filzmail.com','jetable.fr.nf',
  'noref.in','spamfree24.org','temporarymail.com',
  'wegwerfmail.de','mailtemp.info','tempinbox.com',
  'discard.email','tempr.email','mytrashmail.com',
  // ── Getnada / Mailnesia / Nada ──
  'getnada.com','mailnesia.com','nada.email',
  // ── Mohmal / Mintemail / Spamevade ──
  'mohmal.com','mintemail.com','spamevade.com',
  // ── Inboxbear / EmailOnDeck ──
  'inboxbear.com','emailondeck.com',
  // ── Burnermail / Anonaddy ──
  'burnermail.io',
  // ── Mailsac ──
  'mailsac.com',
  // ── Mailnull / Spamgourmet aliases ──
  'spam.su','antispam24.de',
  // ── Ezztt / Easytrashmail ──
  'ezztt.com','easytrashmail.com',
  // ── Phổ biến tại VN ──
  'fakemail.net','fakemailgenerator.com','fake-email.pp.ua',
  'tempail.com','discard.email','mailnew.com',
])

/**
 * Kiểm tra email có phải disposable không.
 * Trả về true nếu bị chặn.
 */
function isDisposableEmail(email) {
  if (!email || !email.includes('@')) return false
  const domain = email.split('@')[1].toLowerCase().trim()
  return DISPOSABLE_DOMAINS.has(domain)
}

const DISPOSABLE_ERROR = 'Email tạm thời không được chấp nhận. Vui lòng dùng email thật (Gmail, Outlook, v.v.)'

// ── Auth functions ─────────────────────────────────────────────────────────

// Đăng ký tài khoản mới
export async function signUp({ email, password, fullName, targetBand }) {
  if (isDisposableEmail(email)) throw new Error(DISPOSABLE_ERROR)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, target_band: targetBand }
    }
  })
  if (error) throw error
  return data
}

// Đăng nhập
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// Đăng nhập bằng Google
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })
  if (error) throw error
}

// Đăng xuất
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Quên mật khẩu — cũng chặn disposable để tránh spam reset link
export async function resetPassword(email) {
  if (isDisposableEmail(email)) throw new Error(DISPOSABLE_ERROR)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) throw error
}

// Lấy profile của user
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Cập nhật profile
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}