import { supabase } from './supabase'

// Tạo mã đơn hàng mới
export function generateOrderCode() {
  return `IELTS${Date.now().toString().slice(-6)}`
}

// Lưu đơn hàng vào database
export async function createPaymentOrder(userId) {
  const orderCode = generateOrderCode()

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      order_code: orderCode,
      amount: 99000,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return { ...data, orderCode }
}

// Kiểm tra trạng thái thanh toán (dùng để polling)
export async function checkPaymentStatus(orderCode) {
  const { data, error } = await supabase
    .from('payments')
    .select('status, verified_at')
    .eq('order_code', orderCode)
    .single()
  if (error) throw error
  return data.status // 'pending' | 'verified' | 'failed'
}

// Polling tự động — gọi hàm này sau khi user nhấn "Tôi đã chuyển khoản"
// Tự kiểm tra mỗi 5 giây, tối đa 15 phút
export function startPaymentPolling(orderCode, onSuccess, onExpire) {
  let attempts = 0
  const maxAttempts = 180 // 180 x 5s = 15 phút

  const interval = setInterval(async () => {
    attempts++
    try {
      const status = await checkPaymentStatus(orderCode)
      if (status === 'verified') {
        clearInterval(interval)
        onSuccess()
      } else if (status === 'failed') {
        clearInterval(interval)
        onExpire()
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
        onExpire()
      }
    } catch (e) {
      console.error('Polling error:', e)
    }
  }, 5000)

  // Trả về hàm để dừng polling khi cần
  return () => clearInterval(interval)
}

// Lấy lịch sử thanh toán của user
export async function getPaymentHistory(userId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Kiểm tra tài khoản có đang Premium không
export async function checkPremiumStatus(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', userId)
    .single()
  if (error) throw error

  const isPremium = data.plan === 'premium' &&
    (!data.plan_expires_at || new Date(data.plan_expires_at) > new Date())

  return { isPremium, expiresAt: data.plan_expires_at }
}

// === ADMIN: xác nhận thanh toán thủ công ===
export async function verifyPaymentManually(paymentId, userId) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString()
    })
    .eq('id', paymentId)

  if (paymentError) throw paymentError

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      plan: 'premium',
      plan_expires_at: expiresAt.toISOString()
    })
    .eq('id', userId)

  if (profileError) throw profileError
}

// === ADMIN: từ chối thanh toán ===
export async function rejectPayment(paymentId) {
  const { error } = await supabase
    .from('payments')
    .update({ status: 'failed' })
    .eq('id', paymentId)
  if (error) throw error
}

// === ADMIN: lấy tất cả thanh toán ===
export async function getAllPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// === ADMIN: thống kê doanh thu ===
export async function getRevenueStats() {
  const { data, error } = await supabase
    .from('payments')
    .select('amount, status, created_at')
    .eq('status', 'verified')
  if (error) throw error

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonth = data
    .filter(p => new Date(p.created_at) >= startOfMonth)
    .reduce((sum, p) => sum + p.amount, 0)

  const lastMonth = data
    .filter(p => {
      const d = new Date(p.created_at)
      return d >= startOfLastMonth && d < startOfMonth
    })
    .reduce((sum, p) => sum + p.amount, 0)

  return {
    total: data.reduce((sum, p) => sum + p.amount, 0),
    thisMonth,
    lastMonth,
    growth: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0
  }
}