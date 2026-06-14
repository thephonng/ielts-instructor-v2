import { useState, useEffect } from 'react'
import { getAllPassagesAdmin, createPassage, updatePassage, deletePassage } from '../lib/passages'
import { getAllWritingPromptsAdmin, createWritingPrompt, updateWritingPrompt, deleteWritingPrompt } from '../lib/writing'
import { getAllPayments, verifyPaymentManually, rejectPayment } from '../lib/payments'
import {
  getAllListeningPassagesAdmin,
  createListeningPassage,
  updateListeningPassage,
  deleteListeningPassage,
} from '../lib/listening'
import {
  getAllExamQuestions,
  createExamQuestion,
  updateExamQuestion,
  deleteExamQuestion,
} from '../lib/adminExam'
import { supabase } from '../lib/supabase'
import { getPassageImages, savePassageImages } from '../lib/passageImages'

const RED = '#B91C1C'
const RED_LIGHT = '#FEF2F2'
const RED_DARK = '#7F1D1D'

function Card({ children, style = {} }) {
  return <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, ...style }}>{children}</div>
}
function Badge({ children, bg = RED_LIGHT, color = RED, style = {} }) {
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, display: 'inline-block', ...style }}>{children}</span>
}
function Btn({ children, onClick, outline, color = RED, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: outline ? `1.5px solid ${color}` : 'none', background: disabled ? '#e5e7eb' : outline ? '#fff' : color, color: disabled ? '#aaa' : outline ? color : '#fff', cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      {children}
    </button>
  )
}
function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', fontSize: 14, border: '1.5px solid #D1D5DB', borderRadius: 8, outline: 'none' }}
        onFocus={e => e.target.style.border = `1.5px solid ${RED}`}
        onBlur={e => e.target.style.border = '1.5px solid #D1D5DB'} />
    </div>
  )
}
function Textarea({ label, value, onChange, placeholder, rows = 5, hint }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>}
      {hint && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 10px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{hint}</div>}
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', fontSize: 14, border: '1.5px solid #D1D5DB', borderRadius: 8, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
        onFocus={e => e.target.style.border = `1.5px solid ${RED}`}
        onBlur={e => e.target.style.border = '1.5px solid #D1D5DB'} />
    </div>
  )
}
function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', fontSize: 14, border: '1.5px solid #D1D5DB', borderRadius: 8, outline: 'none', background: '#fff' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <button onClick={() => onChange(!checked)}
        style={{ width: 44, height: 24, borderRadius: 12, background: checked ? RED : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </button>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</label>}
    </div>
  )
}
function Toast({ msg }) {
  if (!msg) return null
  return <div style={{ position: 'fixed', top: 20, right: 20, background: '#111', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 14, zIndex: 999, maxWidth: 320 }}>{msg}</div>
}

const TOPICS = [
  { value: 'health', label: 'Sức khỏe & Thể thao' },
  { value: 'education', label: 'Giáo dục' },
  { value: 'science', label: 'Khoa học' },
  { value: 'environment', label: 'Môi trường' },
  { value: 'technology', label: 'Công nghệ' },
  { value: 'economy', label: 'Kinh tế' },
  { value: 'academic', label: 'Academic' },
]

const READING_QUESTION_TYPES = [
  { value: 'true_false', label: 'True / False / Not Given' },
  { value: 'yes_no', label: 'Yes / No / Not Given' },
  { value: 'matching_headings', label: 'Matching Headings' },
  { value: 'matching_info', label: 'Matching Information' },
  { value: 'matching_features', label: 'Matching Features' },
  { value: 'mcq_single', label: 'MCQ Single' },
  { value: 'mcq_multi', label: 'MCQ Multi' },
  { value: 'gap_filling', label: 'Gap Filling' },
  { value: 'diagram_label', label: 'Diagram Labelling' },
  { value: 'map_label', label: 'Map Labelling' },
]

const LISTENING_QUESTION_TYPES = [
  { value: 'gap_filling', label: 'Gap Filling' },
  { value: 'map_diagram_label', label: 'Map / Diagram Label' },
  { value: 'mcq_single', label: 'MCQ Single' },
  { value: 'mcq_multi', label: 'MCQ Multi' },
  { value: 'matching', label: 'Matching' },
]

// ─── Question Format Hints ────────────────────────────────────────────────────
const QUESTION_HINTS = {
  mcq_single: `Q: What is the main topic?
A. Possible problems due to global warming
B. Disagreement about temperatures
C. Warmer places
D. Benefits of change
ANSWER: A
EXPLAIN: The passage discusses...

(blank line between questions)`,

  mcq_multi: `Q: Which TWO are mentioned?
A. Rising sea levels
B. More hurricanes
C. Cooler winters
D. Melting glaciers
ANSWER: A,B
EXPLAIN: Optional explanation

(blank line between questions)`,

  true_false: `Q: Scientists agree on how fast temperatures will rise.
ANSWER: False
EXPLAIN: The passage says no one is certain...

(blank line between questions)`,

  yes_no: `Q: The author supports immediate action.
ANSWER: Yes
EXPLAIN: Optional explanation

(blank line between questions)`,

  gap_filling: `Q: Glaciers in the North and South Poles will ___ within two centuries.
ANSWER: melt
EXPLAIN: Optional explanation

(blank line between questions)`,

  matching_headings: `Q: Paragraph A
OPTIONS: i. Climate predictions, ii. Scientific debate, iii. Coastal impacts, iv. Future solutions
ANSWER: ii
EXPLAIN: Optional explanation

(blank line between questions)`,

  matching_info: `Q: The claim that sea levels will rise
OPTIONS: A, B, C, D
ANSWER: B
EXPLAIN: Optional explanation

(blank line between questions)`,

  matching_features: `Q: Predicts great droughts
OPTIONS: Scientist A, Scientist B, Scientist C
ANSWER: Scientist A
EXPLAIN: Optional explanation

(blank line between questions)`,

  map_diagram_label: `Q: Label the area marked with an arrow
OPTIONS: Desert, Forest, Coastline, Mountain
ANSWER: Coastline
EXPLAIN: Optional explanation

(blank line between questions)`,

  map_label: `Q: Location of the main glacier
OPTIONS: North, South, East, West
ANSWER: North
EXPLAIN: Optional explanation

(blank line between questions)`,

  diagram_label: `Q: The part labelled X in the diagram
OPTIONS: Evaporation, Condensation, Precipitation, Runoff
ANSWER: Evaporation
EXPLAIN: Optional explanation

(blank line between questions)`,

  matching: `Q: Campus library
OPTIONS: Open 24 hours, Closes at 9pm, Closed weekends, Opens at 8am
ANSWER: Closes at 9pm
EXPLAIN: Optional explanation

(blank line between questions)`,

  map_diagram_label: `Q: The building near the entrance
OPTIONS: Cafeteria, Library, Gym, Office
ANSWER: Library
EXPLAIN: Optional explanation

(blank line between questions)`,
}

// ─── Plain Text → JSON Parser ─────────────────────────────────────────────────
function parseQuestionsText(text, questionType) {
  // If it looks like JSON already, just parse it
  const trimmed = text.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (e) {
      throw new Error('JSON không hợp lệ. Kiểm tra lại định dạng JSON hoặc dùng định dạng text.')
    }
  }

  // Split into question blocks by blank lines
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  if (blocks.length === 0) return []

  const questions = blocks.map((block, idx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    const q = {
      id: `q${idx + 1}`,
      question_type: questionType,
      question_text: '',
      correct_answer: '',
      options: [],
      explanation: '',
    }

    for (const line of lines) {
      // Question line
      if (line.match(/^Q:/i)) {
        q.question_text = line.replace(/^Q:\s*/i, '').trim()
      }
      // MCQ options A. B. C. D.
      else if (line.match(/^[A-Da-d][.)]\s+/)) {
        q.options.push(line)
      }
      // OPTIONS: line (for matching/headings)
      else if (line.match(/^OPTIONS:/i)) {
        const optStr = line.replace(/^OPTIONS:\s*/i, '').trim()
        q.options = optStr.split(',').map(o => o.trim())
      }
      // ANSWER line
      else if (line.match(/^ANSWER:/i)) {
        q.correct_answer = line.replace(/^ANSWER:\s*/i, '').trim()
      }
      // EXPLAIN line
      else if (line.match(/^EXPLAIN:/i)) {
        q.explanation = line.replace(/^EXPLAIN:\s*/i, '').trim()
      }
      // If no Q: prefix but first line and question_text empty, use as question
      else if (!q.question_text && !line.match(/^(ANSWER|EXPLAIN|OPTIONS):/i)) {
        q.question_text = line
      }
    }

    if (!q.question_text) throw new Error(`Câu hỏi ${idx + 1}: thiếu nội dung câu hỏi (dòng "Q: ...")`)
    if (!q.correct_answer) throw new Error(`Câu hỏi ${idx + 1}: thiếu đáp án (dòng "ANSWER: ...")`)

    return q
  })

  return questions
}

// ── Overview ──
function Overview() {
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, monthlyRevenue: 0, pendingPayments: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('plan'),
      supabase.from('payments').select('amount, status, created_at'),
    ]).then(([usersRes, paymentsRes]) => {
      const users = usersRes.data || []
      const payments = paymentsRes.data || []
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyRevenue = payments
        .filter(p => p.status === 'verified' && new Date(p.created_at) >= startOfMonth)
        .reduce((s, p) => s + p.amount, 0)
      setStats({
        totalUsers: users.length,
        premiumUsers: users.filter(u => u.plan === 'premium').length,
        monthlyRevenue,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const cards = [
    { icon: '👥', label: 'Tổng học viên', value: stats.totalUsers },
    { icon: '⭐', label: 'Premium', value: stats.premiumUsers },
    { icon: '💰', label: 'Doanh thu tháng', value: `${stats.monthlyRevenue.toLocaleString('vi-VN')}₫` },
    { icon: '⏳', label: 'Chờ xác nhận', value: stats.pendingPayments, alert: stats.pendingPayments > 0 },
  ]

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Tổng quan</h2>
      {loading ? <div style={{ color: '#888' }}>Đang tải...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
          {cards.map((c, i) => (
            <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, border: c.alert ? `1.5px solid ${RED}` : '1px solid #e5e7eb' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: RED_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.alert ? RED : '#111' }}>{c.value}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Image Manager ──
function ImageManager({ images, setImages }) {
  const add = () => setImages(p => [...p, { url: '', caption: '' }])
  const remove = (i) => setImages(p => p.filter((_, idx) => idx !== i))
  const update = (i, key, val) => setImages(p => p.map((img, idx) => idx === i ? { ...img, [key]: val } : img))

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>🗺️ Ảnh Map / Diagram</label>
        <Btn outline onClick={add} style={{ padding: '4px 12px', fontSize: 12 }}>+ Thêm ảnh</Btn>
      </div>
      {images.map((img, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: 2 }}>
            <input
              value={img.url}
              onChange={e => update(i, 'url', e.target.value)}
              placeholder="URL ảnh (từ Supabase Storage hoặc link ngoài)"
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1.5px solid #D1D5DB', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              value={img.caption}
              onChange={e => update(i, 'caption', e.target.value)}
              placeholder="Caption (tuỳ chọn)"
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1.5px solid #D1D5DB', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button onClick={() => remove(i)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#EF4444', fontSize: 13, flexShrink: 0 }}>✕</button>
        </div>
      ))}
      {images.length === 0 && (
        <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', padding: '8px 0' }}>
          Không có ảnh — chỉ cần thêm nếu là dạng Map / Diagram Label
        </div>
      )}
    </div>
  )
}

// ── Passages Manager ──
function PassagesManager() {
  const [passages, setPassages] = useState([])
  const [mode, setMode] = useState('list')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const blank = { title: '', topic: 'health', text_en: '', text_vi: '', vocabulary: '', questions: '', status: 'draft', question_type: 'true_false', is_pro: false }
  const [form, setForm] = useState(blank)
  const [images, setImages] = useState([])
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    getAllPassagesAdmin().then(setPassages).catch(console.error).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.title || !form.text_en) { showToast('❌ Vui lòng điền tiêu đề và nội dung.'); return }

    // Parse questions from plain text
    let parsedQuestions = []
    if (form.questions && form.questions.trim()) {
      try {
        parsedQuestions = parseQuestionsText(form.questions, form.question_type)
      } catch (e) {
        showToast('❌ ' + e.message)
        return
      }
    }

    try {
      const data = {
        ...form,
        vocabulary: form.vocabulary ? form.vocabulary.split('\n').filter(Boolean) : [],
        questions: parsedQuestions,
      }
      if (editing) {
        const updated = await updatePassage(editing, data)
        await savePassageImages(editing, 'reading', images)
        setPassages(ps => ps.map(p => p.id === editing ? updated : p))
        showToast('✅ Đã cập nhật!')
      } else {
        const created = await createPassage(data)
        await savePassageImages(created.id, 'reading', images)
        setPassages(ps => [created, ...ps])
        showToast('✅ Đã thêm bài đọc mới!')
      }
      setForm(blank); setImages([]); setEditing(null); setMode('list')
    } catch (e) { showToast('❌ Lỗi: ' + e.message) }
  }

  const del = async (id) => {
    if (!window.confirm('Xóa bài đọc này?')) return
    try { await deletePassage(id); setPassages(ps => ps.filter(p => p.id !== id)); showToast('🗑️ Đã xóa.') }
    catch (e) { showToast('❌ ' + e.message) }
  }

  const toggleStatus = async (p) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published'
    try {
      await updatePassage(p.id, { status: newStatus })
      setPassages(ps => ps.map(x => x.id === p.id ? { ...x, status: newStatus } : x))
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const currentHint = QUESTION_HINTS[form.question_type] || ''

  if (mode !== 'list') return (
    <div style={{ maxWidth: 700 }}>
      <Toast msg={toast} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setMode('list')} style={{ fontSize: 14, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>← Quay lại</button>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{editing ? 'Chỉnh sửa bài đọc' : 'Thêm bài đọc mới'}</h3>
      </div>
      <Card>
        <Input label="Tiêu đề (tiếng Anh)" value={form.title} onChange={v => f('title', v)} placeholder="The Impact of Exercise on Mental Health" />
        <Select label="Chủ đề" value={form.topic} onChange={v => f('topic', v)} options={TOPICS.filter(t => t.value !== 'academic')} />
        <Select label="Loại câu hỏi" value={form.question_type} onChange={v => f('question_type', v)} options={READING_QUESTION_TYPES} />
        <Toggle label="Bài Pro (chỉ dành cho Premium)" checked={!!form.is_pro} onChange={v => f('is_pro', v)} />
        <Textarea label="Nội dung tiếng Anh" value={form.text_en} onChange={v => f('text_en', v)} placeholder="Dán nội dung bài đọc tiếng Anh..." rows={8} />
        <Textarea label="Bản dịch tiếng Việt" value={form.text_vi} onChange={v => f('text_vi', v)} placeholder="Dán bản dịch tiếng Việt..." rows={6} />
        <Textarea label="Từ vựng (mỗi dòng: từ = nghĩa)" value={form.vocabulary} onChange={v => f('vocabulary', v)} placeholder={'sedentary = ít vận động\nneurogenesis = sinh thần kinh'} rows={4} />
        <Textarea
          label={`Câu hỏi & Đáp án — định dạng text đơn giản (${READING_QUESTION_TYPES.find(t => t.value === form.question_type)?.label})`}
          value={form.questions}
          onChange={v => f('questions', v)}
          placeholder="Xem ví dụ định dạng bên dưới..."
          rows={8}
          hint={currentHint}
        />
        <ImageManager images={images} setImages={setImages} />
        <Select label="Trạng thái" value={form.status} onChange={v => f('status', v)} options={[{ value: 'draft', label: 'Bản nháp' }, { value: 'published', label: 'Xuất bản' }]} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn onClick={save}>{editing ? '💾 Lưu' : '✅ Thêm bài đọc'}</Btn>
          <Btn outline onClick={() => setMode('list')}>Hủy</Btn>
        </div>
      </Card>
    </div>
  )

  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>📖 Bài đọc ({passages.length})</h2>
        <Btn onClick={() => { setForm(blank); setImages([]); setEditing(null); setMode('add') }}>+ Thêm bài đọc</Btn>
      </div>
      {loading ? <div style={{ color: '#888' }}>Đang tải...</div> : passages.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 15, color: '#888' }}>Chưa có bài đọc nào. Nhấn "+ Thêm bài đọc" để bắt đầu.</div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Tiêu đề', 'Chủ đề', 'Loại câu hỏi', 'Câu hỏi', 'Trạng thái', 'Ngày tạo', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {passages.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < passages.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#111', maxWidth: 200 }}>
                      {p.title}
                      {p.is_pro && <Badge bg="#FEF3C7" color="#92400E" style={{ marginLeft: 6 }}>PRO</Badge>}
                    </td>
                    <td style={{ padding: '11px 16px' }}><Badge bg="#EFF6FF" color="#1D4ED8">{TOPICS.find(t => t.value === p.topic)?.label || p.topic}</Badge></td>
                    <td style={{ padding: '11px 16px' }}>
                      {p.question_type && <Badge bg="#f3f4f6" color="#555">{p.question_type}</Badge>}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#888', textAlign: 'center' }}>
                      {Array.isArray(p.questions) ? p.questions.length : 0}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <button onClick={() => toggleStatus(p)}
                        style={{ background: p.status === 'published' ? '#DCFCE7' : '#f3f4f6', color: p.status === 'published' ? '#166534' : '#888', border: 'none', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        {p.status === 'published' ? '✓ Xuất bản' : '⬜ Bản nháp'}
                      </button>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn outline onClick={() => {
                          setForm({
                            title: p.title,
                            topic: p.topic,
                            text_en: p.text_en || '',
                            text_vi: p.text_vi || '',
                            vocabulary: Array.isArray(p.vocabulary) ? p.vocabulary.join('\n') : '',
                            // Convert saved JSON back to text for editing
                            questions: Array.isArray(p.questions) && p.questions.length > 0
                              ? JSON.stringify(p.questions, null, 2)
                              : '',
                            status: p.status,
                            question_type: p.question_type || 'true_false',
                            is_pro: !!p.is_pro
                          })
                          setEditing(p.id); setMode('edit')
                          getPassageImages(p.id).then(imgs =>
                            setImages(imgs.map(i => ({ url: i.image_url, caption: i.caption || '' })))
                          )
                        }} style={{ padding: '5px 10px', fontSize: 12 }}>Sửa</Btn>
                        <Btn outline color="#EF4444" onClick={() => del(p.id)} style={{ padding: '5px 10px', fontSize: 12 }}>Xóa</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Listening Manager ──
function ListeningManager() {
  const [passages, setPassages] = useState([])
  const [mode, setMode] = useState('list')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const blank = {
    title: '', topic: 'academic', audio_url: '', transcript: '', text_vi: '',
    vocabulary: '', question_type: 'gap_filling', is_pro: false, status: 'draft', questions: ''
  }
  const [form, setForm] = useState(blank)
  const [images, setImages] = useState([])
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const LISTENING_TOPICS = [
    { value: 'academic', label: 'Academic' },
    { value: 'environment', label: 'Môi trường' },
    { value: 'science', label: 'Khoa học' },
    { value: 'technology', label: 'Công nghệ' },
    { value: 'health', label: 'Sức khỏe' },
    { value: 'education', label: 'Giáo dục' },
  ]

  useEffect(() => {
    getAllListeningPassagesAdmin().then(setPassages).catch(console.error).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.title || !form.audio_url) { showToast('❌ Điền tiêu đề và URL audio.'); return }

    let parsedQuestions = []
    if (form.questions && form.questions.trim()) {
      try {
        parsedQuestions = parseQuestionsText(form.questions, form.question_type)
      } catch (e) {
        showToast('❌ ' + e.message)
        return
      }
    }

    try {
      const data = {
        title: form.title,
        topic: form.topic,
        audio_url: form.audio_url,
        transcript: form.transcript,
        text_vi: form.text_vi,
        vocabulary: form.vocabulary ? form.vocabulary.split('\n').filter(Boolean) : [],
        question_type: form.question_type,
        is_pro: form.is_pro,
        status: form.status,
        questions: parsedQuestions,
      }
      if (editing) {
        await updateListeningPassage(editing, data)
        await savePassageImages(editing, 'listening', images)
        setPassages(ps => ps.map(p => p.id === editing ? { ...p, ...data } : p))
        showToast('✅ Đã cập nhật!')
      } else {
        const created = await createListeningPassage(data)
        await savePassageImages(created.id, 'listening', images)
        setPassages(ps => [created, ...ps])
        showToast('✅ Đã thêm bài nghe mới!')
      }
      setForm(blank); setImages([]); setEditing(null); setMode('list')
    } catch (e) { showToast('❌ Lỗi: ' + e.message) }
  }

  const del = async (id) => {
    if (!window.confirm('Xóa bài nghe này?')) return
    try { await deleteListeningPassage(id); setPassages(ps => ps.filter(p => p.id !== id)); showToast('🗑️ Đã xóa.') }
    catch (e) { showToast('❌ ' + e.message) }
  }

  const toggleStatus = async (p) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published'
    try {
      await updateListeningPassage(p.id, { status: newStatus })
      setPassages(ps => ps.map(x => x.id === p.id ? { ...x, status: newStatus } : x))
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const currentHint = QUESTION_HINTS[form.question_type] || ''

  if (mode !== 'list') return (
    <div style={{ maxWidth: 700 }}>
      <Toast msg={toast} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setMode('list')} style={{ fontSize: 14, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>← Quay lại</button>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{editing ? 'Chỉnh sửa bài nghe' : 'Thêm bài nghe mới'}</h3>
      </div>
      <Card>
        <Input label="Tiêu đề" value={form.title} onChange={v => f('title', v)} placeholder="VD: Campus Facilities Tour" />
        <Select label="Chủ đề" value={form.topic} onChange={v => f('topic', v)} options={LISTENING_TOPICS} />
        <Input label="URL Audio" value={form.audio_url} onChange={v => f('audio_url', v)} placeholder="https://..." />
        <Select label="Loại câu hỏi" value={form.question_type} onChange={v => f('question_type', v)} options={LISTENING_QUESTION_TYPES} />
        <Toggle label="Bài Pro (chỉ dành cho Premium)" checked={!!form.is_pro} onChange={v => f('is_pro', v)} />
        <Textarea label="Transcript (tiếng Anh)" value={form.transcript} onChange={v => f('transcript', v)} placeholder="Dán transcript bài nghe..." rows={8} />
        <Textarea label="Bản dịch tiếng Việt (tuỳ chọn)" value={form.text_vi} onChange={v => f('text_vi', v)} placeholder="Dán bản dịch tiếng Việt..." rows={5} />
        <Textarea label="Từ vựng (mỗi dòng: từ = nghĩa)" value={form.vocabulary} onChange={v => f('vocabulary', v)} placeholder={'facility = cơ sở vật chất\ncampus = khuôn viên trường'} rows={4} />
        <Textarea
          label={`Câu hỏi & Đáp án — định dạng text đơn giản (${LISTENING_QUESTION_TYPES.find(t => t.value === form.question_type)?.label})`}
          value={form.questions}
          onChange={v => f('questions', v)}
          placeholder="Xem ví dụ định dạng bên dưới..."
          rows={8}
          hint={currentHint}
        />
        <ImageManager images={images} setImages={setImages} />
        <Select label="Trạng thái" value={form.status} onChange={v => f('status', v)} options={[{ value: 'draft', label: 'Bản nháp' }, { value: 'published', label: 'Xuất bản' }]} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn onClick={save}>{editing ? '💾 Lưu' : '✅ Thêm bài nghe'}</Btn>
          <Btn outline onClick={() => setMode('list')}>Hủy</Btn>
        </div>
      </Card>
    </div>
  )

  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>🎧 Bài nghe ({passages.length})</h2>
        <Btn onClick={() => { setForm(blank); setImages([]); setEditing(null); setMode('add') }}>+ Thêm bài nghe</Btn>
      </div>
      {loading ? <div style={{ color: '#888' }}>Đang tải...</div> : passages.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 15, color: '#888' }}>Chưa có bài nghe nào. Nhấn "+ Thêm bài nghe" để bắt đầu.</div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Tiêu đề', 'Chủ đề', 'Loại câu hỏi', 'Câu hỏi', 'Trạng thái', 'Ngày tạo', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {passages.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < passages.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#111', maxWidth: 200 }}>
                      {p.title}
                      {p.is_pro && <Badge bg="#FEF3C7" color="#92400E" style={{ marginLeft: 6 }}>PRO</Badge>}
                    </td>
                    <td style={{ padding: '11px 16px' }}><Badge bg="#EFF6FF" color="#1D4ED8">{p.topic}</Badge></td>
                    <td style={{ padding: '11px 16px' }}>
                      {p.question_type && <Badge bg="#f3f4f6" color="#555">{p.question_type}</Badge>}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#888', textAlign: 'center' }}>
                      {Array.isArray(p.questions) ? p.questions.length : 0}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <button onClick={() => toggleStatus(p)}
                        style={{ background: p.status === 'published' ? '#DCFCE7' : '#f3f4f6', color: p.status === 'published' ? '#166534' : '#888', border: 'none', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        {p.status === 'published' ? '✓ Xuất bản' : '⬜ Bản nháp'}
                      </button>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn outline onClick={() => {
                          setForm({
                            title: p.title, topic: p.topic, audio_url: p.audio_url || '',
                            transcript: p.transcript || '', text_vi: p.text_vi || '',
                            vocabulary: Array.isArray(p.vocabulary) ? p.vocabulary.join('\n') : '',
                            question_type: p.question_type || 'gap_filling', is_pro: !!p.is_pro,
                            status: p.status,
                            questions: Array.isArray(p.questions) && p.questions.length > 0
                              ? JSON.stringify(p.questions, null, 2)
                              : '',
                          })
                          setEditing(p.id); setMode('edit')
                          getPassageImages(p.id).then(imgs =>
                            setImages(imgs.map(i => ({ url: i.image_url, caption: i.caption || '' })))
                          )
                        }} style={{ padding: '5px 10px', fontSize: 12 }}>Sửa</Btn>
                        <Btn outline color="#EF4444" onClick={() => del(p.id)} style={{ padding: '5px 10px', fontSize: 12 }}>Xóa</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Writing Manager ──
function WritingManager() {
  const [prompts, setPrompts] = useState([])
  const [mode, setMode] = useState('list')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const blank = { title: '', task: 'task2', type: 'Opinion', prompt_en: '', prompt_vi: '', sample_essay: '', status: 'draft', image_url: '', is_pro: false }
  const [form, setForm] = useState(blank)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    getAllWritingPromptsAdmin().then(setPrompts).catch(console.error).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.title || !form.prompt_en) { showToast('❌ Điền tiêu đề và đề bài tiếng Anh.'); return }
    try {
      if (editing) {
        const updated = await updateWritingPrompt(editing, form)
        setPrompts(ps => ps.map(p => p.id === editing ? updated : p))
        showToast('✅ Đã cập nhật!')
      } else {
        const created = await createWritingPrompt(form)
        setPrompts(ps => [created, ...ps])
        showToast('✅ Đã thêm đề Writing!')
      }
      setForm(blank); setEditing(null); setMode('list')
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const del = async (id) => {
    if (!window.confirm('Xóa đề này?')) return
    try { await deleteWritingPrompt(id); setPrompts(ps => ps.filter(p => p.id !== id)); showToast('🗑️ Đã xóa.') }
    catch (e) { showToast('❌ ' + e.message) }
  }

  const taskTypes = { task1: ['Bar Chart', 'Line Chart', 'Pie Chart', 'Table', 'Process Diagram', 'Map'], task2: ['Opinion', 'Discussion', 'Problem/Solution', 'Advantages/Disadvantages', 'Two-part Question'] }

  if (mode !== 'list') return (
    <div style={{ maxWidth: 700 }}>
      <Toast msg={toast} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setMode('list')} style={{ fontSize: 14, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>← Quay lại</button>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{editing ? 'Chỉnh sửa đề Writing' : 'Thêm đề Writing mới'}</h3>
      </div>
      <Card>
        <Input label="Tiêu đề (tiếng Việt)" value={form.title} onChange={v => f('title', v)} placeholder="VD: Công nghệ và giáo dục" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select label="Task" value={form.task} onChange={v => f('task', v)} options={[{ value: 'task1', label: 'Task 1' }, { value: 'task2', label: 'Task 2' }]} />
          <Select label="Loại đề" value={form.type} onChange={v => f('type', v)} options={(taskTypes[form.task] || taskTypes.task2).map(t => ({ value: t, label: t }))} />
        </div>
        <Textarea label="Đề bài tiếng Anh" value={form.prompt_en} onChange={v => f('prompt_en', v)} placeholder="Dán đề bài tiếng Anh..." rows={4} />
        <Toggle label="Đề Pro (chỉ dành cho Premium)" checked={!!form.is_pro} onChange={v => f('is_pro', v)} />
        {form.task === 'task1' && (
          <Input label="URL ảnh biểu đồ (Task 1)" value={form.image_url || ''} onChange={v => f('image_url', v)} placeholder="https://..." />
          )}
        <Textarea label="Đề bài tiếng Việt" value={form.prompt_vi} onChange={v => f('prompt_vi', v)} placeholder="Dán bản dịch tiếng Việt..." rows={4} />
        <Textarea label="Bài mẫu Band 8+" value={form.sample_essay} onChange={v => f('sample_essay', v)} placeholder="Dán bài mẫu Band 8+ vào đây..." rows={10} />
        <Select label="Trạng thái" value={form.status} onChange={v => f('status', v)} options={[{ value: 'draft', label: 'Bản nháp' }, { value: 'published', label: 'Xuất bản' }]} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn onClick={save}>{editing ? '💾 Lưu' : '✅ Thêm đề Writing'}</Btn>
          <Btn outline onClick={() => setMode('list')}>Hủy</Btn>
        </div>
      </Card>
    </div>
  )

  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>✍️ Đề Writing ({prompts.length})</h2>
        <Btn onClick={() => { setForm(blank); setEditing(null); setMode('add') }}>+ Thêm đề Writing</Btn>
      </div>
      {loading ? <div style={{ color: '#888' }}>Đang tải...</div> : prompts.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 15, color: '#888' }}>Chưa có đề Writing nào.</div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Tiêu đề', 'Task', 'Loại', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prompts.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < prompts.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#111', maxWidth: 220 }}>{p.title}</td>
                    <td style={{ padding: '11px 16px' }}><Badge bg={p.task === 'task1' ? '#EFF6FF' : RED_LIGHT} color={p.task === 'task1' ? '#1D4ED8' : RED}>{p.task === 'task1' ? 'Task 1' : 'Task 2'}</Badge></td>
                    <td style={{ padding: '11px 16px', color: '#555' }}>{p.type}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <Badge bg={p.status === 'published' ? '#DCFCE7' : '#f3f4f6'} color={p.status === 'published' ? '#166534' : '#888'}>
                        {p.status === 'published' ? '✓ Xuất bản' : '⬜ Nháp'}
                      </Badge>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn outline onClick={() => { setForm({ title: p.title, task: p.task, type: p.type, prompt_en: p.prompt_en || '', prompt_vi: p.prompt_vi || '', sample_essay: p.sample_essay || '', status: p.status, image_url: p.image_url || '', is_pro: !!p.is_pro }); setEditing(p.id); setMode('edit') }} style={{ padding: '5px 10px', fontSize: 12 }}>Sửa</Btn>
                        <Btn outline color="#EF4444" onClick={() => del(p.id)} style={{ padding: '5px 10px', fontSize: 12 }}>Xóa</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Users Manager ──
function UsersManager() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setUsers(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>👥 Học viên ({users.length})</h2>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm theo tên hoặc email..."
        style={{ width: '100%', maxWidth: 360, padding: '9px 12px', fontSize: 14, border: '1.5px solid #D1D5DB', borderRadius: 8, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
      {loading ? <div style={{ color: '#888' }}>Đang tải...</div> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Học viên', 'Gói', 'Streak', 'Mục tiêu', 'Ngày tham gia'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <button
                        onClick={async () => {
                          const newPlan = u.plan === 'premium' ? 'free' : 'premium'
                          const { error } = await supabase
                            .from('profiles')
                            .update({ plan: newPlan })
                            .eq('id', u.id)
                          if (error) { alert('❌ Lỗi: ' + error.message); return }
                          setUsers(us => us.map(x => x.id === u.id ? { ...x, plan: newPlan } : x))
                        }}
                        title={u.plan === 'premium' ? 'Click để hạ xuống Free' : 'Click để nâng lên Premium'}
                        style={{
                          background: u.plan === 'premium' ? '#DCFCE7' : '#f3f4f6',
                          color: u.plan === 'premium' ? '#166534' : '#888',
                          border: 'none', borderRadius: 20, padding: '4px 12px',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        {u.plan === 'premium' ? '⭐ Premium' : 'Free'}
                      </button>
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: RED }}>🔥 {u.streak_current || 0}</td>
                    <td style={{ padding: '11px 16px', color: '#555' }}>{u.target_band || '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Payments Manager ──
function PaymentsManager() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => {
    getAllPayments().then(setPayments).catch(console.error).finally(() => setLoading(false))
  }, [])

  const verify = async (p) => {
    try {
      await verifyPaymentManually(p.id, p.user_id)
      setPayments(ps => ps.map(x => x.id === p.id ? { ...x, status: 'verified' } : x))
      showToast('✅ Đã xác nhận. Tài khoản đã lên Premium!')
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const reject = async (id) => {
    try {
      await rejectPayment(id)
      setPayments(ps => ps.map(x => x.id === id ? { ...x, status: 'failed' } : x))
      showToast('❌ Đã từ chối thanh toán.')
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const pending = payments.filter(p => p.status === 'pending')

  return (
    <div>
      <Toast msg={toast} />
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>💳 Thanh toán</h2>
      {pending.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 10 }}>⏳ {pending.length} giao dịch chờ xác nhận</div>
          {pending.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #F59E0B', borderRadius: 8, padding: '10px 14px', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.profiles?.full_name || '—'} — {p.amount?.toLocaleString('vi-VN')}₫</div>
                <div style={{ fontSize: 12, color: '#888' }}>{p.order_code} · {new Date(p.created_at).toLocaleDateString('vi-VN')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={() => verify(p)} style={{ padding: '7px 14px' }}>✅ Xác nhận</Btn>
                <Btn outline color="#EF4444" onClick={() => reject(p.id)} style={{ padding: '7px 14px' }}>✗ Từ chối</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      {loading ? <div style={{ color: '#888' }}>Đang tải...</div> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Mã đơn', 'Học viên', 'Số tiền', 'Ngày', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 12, color: '#555' }}>{p.order_code}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{p.profiles?.full_name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{p.profiles?.email}</div>
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: RED }}>{p.amount?.toLocaleString('vi-VN')}₫</td>
                    <td style={{ padding: '11px 16px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <Badge bg={p.status === 'verified' ? '#DCFCE7' : p.status === 'pending' ? '#FFFBEB' : '#FEF2F2'} color={p.status === 'verified' ? '#166534' : p.status === 'pending' ? '#92400E' : '#991B1B'}>
                        {p.status === 'verified' ? '✓ Thành công' : p.status === 'pending' ? '⏳ Chờ' : '✗ Thất bại'}
                      </Badge>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      {p.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn onClick={() => verify(p)} style={{ padding: '5px 10px', fontSize: 12 }}>✅</Btn>
                          <Btn outline color="#EF4444" onClick={() => reject(p.id)} style={{ padding: '5px 10px', fontSize: 12 }}>✗</Btn>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Entrance Exam Manager ──
// ── Entrance Exam Manager (refactored) ──
const EXAM_SKILLS = [
  { value: 'listening', label: '🎧 Listening' },
  { value: 'reading',   label: '📖 Reading'   },
]

const EXAM_QUESTION_TYPES_BY_SKILL = {
  listening: [
    { value: 'gap_filling',       label: 'Gap Filling'          },
    { value: 'map_diagram_label', label: 'Map / Diagram Label'  },
    { value: 'mcq_single',        label: 'MCQ Single'           },
    { value: 'mcq_multi',         label: 'MCQ Multi'            },
    { value: 'matching',          label: 'Matching'             },
  ],
  reading: [
    { value: 'true_false',        label: 'True / False / Not Given' },
    { value: 'yes_no',            label: 'Yes / No / Not Given'     },
    { value: 'mcq_single',        label: 'MCQ Single'               },
    { value: 'mcq_multi',         label: 'MCQ Multi'                },
    { value: 'gap_filling',       label: 'Gap Filling'              },
    { value: 'matching_headings', label: 'Matching Headings'        },
  ],
}

function DifficultyStars({ value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Độ khó</label>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: n <= value ? '#F59E0B' : '#D1D5DB', padding: 0 }}>★</button>
        ))}
      </div>
    </div>
  )
}

function EntranceExamManager() {
  const [sections, setSections] = useState([])   // grouped by section
  const [questions, setQuestions] = useState([]) // flat list from DB
  const [mode, setMode] = useState('list')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState([])

  const blank = {
    skill: 'listening',
    question_type: 'gap_filling',
    difficulty: 3,
    order_index: 1,
    points: 1,
    // Listening fields
    audio_url: '',
    transcript: '',
    // Reading fields
    passage_text: '',
    passage_title: '',
    // Questions (plain text, parsed like Reading/Listening Manager)
    questions_text: '',
  }
  const [form, setForm] = useState(blank)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    getAllExamQuestions()
      .then(qs => setQuestions(qs.sort((a, b) => a.order_index - b.order_index)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSkillChange = (skill) => {
    f('skill', skill)
    f('question_type', EXAM_QUESTION_TYPES_BY_SKILL[skill][0].value)
  }

  const save = async () => {
    if (!form.questions_text.trim()) {
      showToast('❌ Vui lòng nhập câu hỏi.'); return
    }

    let parsedQuestions = []
    try {
      parsedQuestions = parseQuestionsText(form.questions_text, form.question_type)
    } catch (e) {
      showToast('❌ ' + e.message); return
    }

    // Validate context fields
    if (form.skill === 'listening' && !form.audio_url) {
      showToast('❌ Vui lòng nhập URL Audio cho bài Listening.'); return
    }
    if (form.skill === 'reading' && !form.passage_text) {
      showToast('❌ Vui lòng nhập nội dung đoạn văn Reading.'); return
    }
 // Detect duplicate question blocks (same question_text + same answer)
    const seen = new Set()
    const dups = []
    parsedQuestions.forEach((pq, idx) => {
      const key = (pq.question_text + '|' + pq.correct_answer).trim().toLowerCase()
      if (seen.has(key)) dups.push(idx + 1)
      seen.add(key)
    })
    if (dups.length > 0) {
      const ok = window.confirm(
        `⚠️ Phát hiện ${dups.length} câu hỏi bị TRÙNG nội dung (câu số ${dups.join(', ')} trong danh sách bạn vừa nhập). ` +
        `Có thể bạn đã dán nội dung 2 lần vào ô "Câu hỏi & Đáp án". Bạn vẫn muốn tiếp tục thêm tất cả?`
      )
      if (!ok) return
    }
    try {
      // Each "section" creates multiple questions in DB, all sharing the same
      // passage context (audio_url / passage_text) stored in first question or
      // a separate sections table. Here we save flat like before but with full context.
      const baseData = {
        skill: form.skill,
        question_type: form.question_type,
        difficulty: Number(form.difficulty),
        points: Number(form.points) || 1,
        order_index: Number(form.order_index) || 1,
        // Context
        audio_url: form.skill === 'listening' ? form.audio_url : null,
        transcript: form.skill === 'listening' ? form.transcript : null,
        passage_text: form.skill === 'reading' ? form.passage_text : null,
        passage_title: form.skill === 'reading' ? form.passage_title : null,
      }

      if (editing) {
        // When editing, update just the first parsed question into that record
        const firstQ = parsedQuestions[0]
        const data = {
          ...baseData,
          question_text: firstQ.question_text,
          options: firstQ.options?.length
            ? Object.fromEntries(firstQ.options.map((o, i) => [String.fromCharCode(65 + i), o]))
            : {},
          correct_answer: firstQ.correct_answer,
          explanation: firstQ.explanation || '',
        }
        const updated = await updateExamQuestion(editing, data)
        await savePassageImages(editing, 'exam', images)
        setQuestions(qs => qs.map(q => q.id === editing ? updated : q))
        showToast('✅ Đã cập nhật!')
      } else {
        // Creating: insert one DB row per parsed question
        const created = []
        for (let i = 0; i < parsedQuestions.length; i++) {
          const pq = parsedQuestions[i]
          const data = {
            ...baseData,
            order_index: Number(form.order_index) + i,
            question_text: pq.question_text,
            options: pq.options?.length
              ? Object.fromEntries(pq.options.map((o, idx) => [String.fromCharCode(65 + idx), o]))
              : {},
            correct_answer: pq.correct_answer,
            explanation: pq.explanation || '',
          }
          const result = await createExamQuestion(data)
          if (i === 0) await savePassageImages(result.id, 'exam', images)
          created.push(result)
        }
        setQuestions(qs => [...qs, ...created].sort((a, b) => a.order_index - b.order_index))
        showToast(`✅ Đã thêm ${created.length} câu hỏi!`)
      }

      setForm(blank); setImages([]); setEditing(null); setMode('list')
    } catch (e) { showToast('❌ Lỗi: ' + e.message) }
  }

  const del = async (id) => {
    if (!window.confirm('Xóa câu hỏi này?')) return
    try {
      await deleteExamQuestion(id)
      setQuestions(qs => qs.filter(q => q.id !== id))
      showToast('🗑️ Đã xóa.')
    } catch (e) { showToast('❌ ' + e.message) }
  }

  const editQ = (q) => {
    const opts = q.options || {}
    // Rebuild plain text for editing (show as JSON for now, editable)
    const questionsText = JSON.stringify([{
      id: q.id,
      question_type: q.question_type,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      options: Object.values(opts),
      explanation: q.explanation || '',
    }], null, 2)

    setForm({
      skill: q.skill || 'listening',
      question_type: q.question_type || 'gap_filling',
      difficulty: q.difficulty || 3,
      order_index: q.order_index || 1,
      points: q.points || 1,
      audio_url: q.audio_url || '',
      transcript: q.transcript || '',
      passage_text: q.passage_text || '',
      passage_title: q.passage_title || '',
      questions_text: questionsText,
    })
    setEditing(q.id)
    setMode('edit')
    getPassageImages(q.id).then(imgs =>
      setImages(imgs.map(i => ({ url: i.image_url, caption: i.caption || '' })))
    )
  }

  const currentHint = QUESTION_HINTS[form.question_type] || ''

  // ── Form view ──
  if (mode !== 'list') return (
    <div style={{ maxWidth: 700 }}>
      <Toast msg={toast} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setMode('list')} style={{ fontSize: 14, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>← Quay lại</button>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{editing ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi / section mới'}</h3>
      </div>
      <Card>
        {/* Skill radio */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Kỹ năng</label>
          <div style={{ display: 'flex', gap: 16 }}>
            {EXAM_SKILLS.map(s => (
              <label key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', fontWeight: form.skill === s.value ? 600 : 400, color: form.skill === s.value ? RED : '#555' }}>
                <input type="radio" checked={form.skill === s.value} onChange={() => handleSkillChange(s.value)} style={{ accentColor: RED }} />
                {s.label}
              </label>
            ))}
          </div>
        </div>

        <Select label="Loại câu hỏi" value={form.question_type} onChange={v => f('question_type', v)}
          options={EXAM_QUESTION_TYPES_BY_SKILL[form.skill]} />

        <DifficultyStars value={form.difficulty} onChange={v => f('difficulty', v)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Thứ tự bắt đầu từ câu số" value={form.order_index} onChange={v => f('order_index', v)} type="number" placeholder="1" />
          <Input label="Điểm / câu" value={form.points} onChange={v => f('points', v)} type="number" placeholder="1" />
        </div>

        {/* Listening context */}
        {form.skill === 'listening' && (
          <>
            <Input label="URL Audio *" value={form.audio_url} onChange={v => f('audio_url', v)} placeholder="https://..." />
            <Textarea label="Transcript" value={form.transcript} onChange={v => f('transcript', v)} placeholder="Dán transcript bài nghe..." rows={5} />
          </>
        )}

        {/* Reading context */}
        {form.skill === 'reading' && (
          <>
            <Input label="Tiêu đề đoạn văn" value={form.passage_title} onChange={v => f('passage_title', v)} placeholder="VD: The Rise of Renewable Energy" />
            <Textarea label="Nội dung đoạn văn (tiếng Anh) *" value={form.passage_text} onChange={v => f('passage_text', v)} placeholder="Dán đoạn văn Reading..." rows={7} />
          </>
        )}

        {/* Questions textarea — same pattern as Reading/Listening Manager */}
        <Textarea
          label={`Câu hỏi & Đáp án — ${EXAM_QUESTION_TYPES_BY_SKILL[form.skill].find(t => t.value === form.question_type)?.label}`}
          value={form.questions_text}
          onChange={v => f('questions_text', v)}
          placeholder="Xem ví dụ định dạng bên dưới..."
          rows={10}
          hint={currentHint}
        />

        <ImageManager images={images} setImages={setImages} />

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn onClick={save}>{editing ? '💾 Lưu' : '✅ Thêm câu hỏi'}</Btn>
          <Btn outline onClick={() => { setForm(blank); setImages([]); setEditing(null); setMode('list') }}>Hủy</Btn>
        </div>
      </Card>
    </div>
  )

  // ── List view ──
  const listeningQs = questions.filter(q => q.skill === 'listening')
  const readingQs   = questions.filter(q => q.skill === 'reading')

  return (
    <div>
      <Toast msg={toast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>📝 Đề thi đầu vào ({questions.length}/40)</h2>
        <Btn onClick={() => { setForm(blank); setImages([]); setEditing(null); setMode('add') }}>+ Thêm section</Btn>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8 }}>🎧 Listening: {listeningQs.length}</div>
        <div style={{ background: RED_LIGHT, color: RED, fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8 }}>📖 Reading: {readingQs.length}</div>
        {questions.length >= 40 && <Badge bg="#DCFCE7" color="#166534" style={{ padding: '6px 14px', borderRadius: 8 }}>✓ Đủ 40 câu</Badge>}
      </div>

      {loading ? <div style={{ color: '#888' }}>Đang tải...</div> : questions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 15, color: '#888' }}>Chưa có câu hỏi nào. Nhấn "+ Thêm section" để bắt đầu.</div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['#', 'Kỹ năng', 'Câu hỏi', 'Loại', 'Độ khó', 'Đáp án', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.id} style={{ borderBottom: i < questions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#888', width: 36 }}>{q.order_index}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <Badge bg={q.skill === 'listening' ? '#EFF6FF' : RED_LIGHT} color={q.skill === 'listening' ? '#1D4ED8' : RED}>
                        {q.skill === 'listening' ? '🎧' : '📖'} {q.skill}
                      </Badge>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#111', maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question_text}</div>
                      {q.explanation && <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.explanation}</div>}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <Badge bg="#f3f4f6" color="#555">{q.question_type}</Badge>
                    </td>
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap', color: '#F59E0B' }}>
                      {'★'.repeat(q.difficulty || 0)}{'☆'.repeat(5 - (q.difficulty || 0))}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ minWidth: 28, height: 24, borderRadius: 6, background: RED, color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                        {q.correct_answer}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn outline onClick={() => editQ(q)} style={{ padding: '5px 10px', fontSize: 12 }}>Sửa</Btn>
                        <Btn outline color="#EF4444" onClick={() => del(q.id)} style={{ padding: '5px 10px', fontSize: 12 }}>Xóa</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Main Admin ──
const ADMIN_NAV = [
  { id: 'overview', icon: '⊞', label: 'Tổng quan' },
  { id: 'passages', icon: '📖', label: 'Bài đọc' },
  { id: 'listening', icon: '🎧', label: 'Bài nghe' },
  { id: 'writing', icon: '✍️', label: 'Đề Writing' },
  { id: 'users', icon: '👥', label: 'Học viên' },
  { id: 'payments', icon: '💳', label: 'Thanh toán' },
  { id: 'exam', icon: '📝', label: 'Đề thi đầu vào' },
]

export default function Admin() {
  const [tab, setTab] = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  const pages = {
    overview: <Overview />,
    passages: <PassagesManager />,
    listening: <ListeningManager />,
    writing: <WritingManager />,
    users: <UsersManager />,
    payments: <PaymentsManager />,
    exam: <EntranceExamManager />,
  }

  const Sidebar = () => (
    <>
      <div style={{ padding: '16px 14px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>ADMIN PANEL</div>
        {ADMIN_NAV.map(n => (
          <button key={n.id} onClick={() => { setTab(n.id); setMobileOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: tab === n.id ? RED_LIGHT : 'none', color: tab === n.id ? RED : '#555', fontWeight: tab === n.id ? 600 : 400, fontSize: 14, cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '12px 14px', borderTop: '1px solid #f3f4f6' }}>
        <button onClick={() => window.location.href = '/'} style={{ width: '100%', fontSize: 12, color: '#EF4444', background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontWeight: 600 }}>
          ← Về website
        </button>
      </div>
    </>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Segoe UI',sans-serif", display: 'flex' }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @media(max-width:768px){.adm-sidebar{display:none!important}.adm-main{margin-left:0!important}} @media(min-width:769px){.adm-mob{display:none!important}}`}</style>

      <div className="adm-sidebar" style={{ position: 'fixed', top: 0, left: 0, width: 200, height: '100vh', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="adm-mob" style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: 220, height: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
            <Sidebar />
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 50, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="adm-mob" onClick={() => setMobileOpen(m => !m)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#555' }}>☰</button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
            {ADMIN_NAV.find(n => n.id === tab)?.label}
          </span>
        </div>
        <Badge bg="#DCFCE7" color="#166534">● Hệ thống hoạt động</Badge>
      </div>

      <div className="adm-main" style={{ marginLeft: 200, paddingTop: 50, flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
          {pages[tab]}
        </div>
      </div>
    </div>
  )
}