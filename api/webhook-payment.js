import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Tắt bodyParser mặc định của Vercel để lấy được raw body gốc
// (cần thiết để tính chữ ký HMAC khớp với SePay)
export const config = {
  api: {
    bodyParser: false,
  },
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SEPAY_WEBHOOK_SECRET = process.env.SEPAY_WEBHOOK_SECRET

// Đọc raw body dạng buffer/string từ request stream
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const signatureHeader = req.headers['x-sepay-signature']
    if (!signatureHeader) {
      console.error('Thiếu header x-sepay-signature')
      return res.status(401).json({ error: 'Missing signature' })
    }
    const signature = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice(7)
      : signatureHeader

    // Lấy raw body gốc (chuỗi thô, chưa qua parse) để tính đúng chữ ký
    const rawBody = await getRawBody(req)

    const expectedSignature = crypto
      .createHmac('sha256', SEPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    console.error('DEBUG - Secret length:', SEPAY_WEBHOOK_SECRET?.length)
    console.error('DEBUG - Received signature:', signature)
    console.error('DEBUG - Expected signature:', expectedSignature)
    console.error('DEBUG - Raw body:', rawBody

    if (signature.length !== expectedSignature.length) {
      console.error('Độ dài chữ ký không khớp - có thể sai secret hoặc định dạng')
      return res.status(401).json({ error: 'Invalid signature format' })
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )

    if (!isValid) {
      console.error('Chữ ký không khớp - có thể là request giả mạo')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Giờ mới parse JSON để lấy dữ liệu, sau khi đã xác thực chữ ký xong
    const body = JSON.parse(rawBody)
    const { content, transferAmount, referenceCode } = body

    const orderCodeMatch = content?.match(/IELTS\d{6}/)
    const orderCode = orderCodeMatch ? orderCodeMatch[0] : null

    if (!orderCode) {
      console.log('Không tìm thấy order_code hợp lệ trong:', content)
      return res.status(200).json({ message: 'No matching order code, ignored' })
    }

    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('id, user_id, amount, status')
      .eq('order_code', orderCode)
      .single()

    if (findError || !payment) {
      console.error('Không tìm thấy đơn hàng:', orderCode, findError)
      return res.status(200).json({ message: 'Order not found, ignored' })
    }

    if (payment.status === 'verified') {
      console.log('Đơn hàng đã được xác nhận trước đó:', orderCode)
      return res.status(200).json({ message: 'Already verified' })
    }

    if (transferAmount && transferAmount < payment.amount) {
      console.error(`Số tiền không khớp: nhận ${transferAmount}, cần ${payment.amount}`)
      return res.status(200).json({ message: 'Amount mismatch, needs manual review' })
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .update({ status: 'verified', verified_at: new Date().toISOString() })
      .eq('id', payment.id)

    if (paymentError) {
      console.error('Lỗi khi cập nhật payment:', paymentError)
      return res.status(500).json({ error: 'Failed to update payment' })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ plan: 'premium', plan_expires_at: expiresAt.toISOString() })
      .eq('id', payment.user_id)

    if (profileError) {
      console.error('Lỗi khi nâng cấp profile:', profileError)
      return res.status(500).json({ error: 'Failed to upgrade profile' })
    }

    console.log('Đã xác nhận và nâng cấp Premium thành công:', orderCode)
    return res.status(200).json({ message: 'Payment verified and premium activated' })

  } catch (err) {
    console.error('Lỗi không xác định trong webhook handler:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
