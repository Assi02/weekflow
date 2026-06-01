import { useState, useEffect } from 'react'
import { supabase } from './supabase'

interface Task {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  scheduled_date: string
  contact_name: string
  contact_phone: string
  contact_email: string
}

interface User {
  id: string
  email?: string
}

const CATEGORIES = ['work', 'home', 'gym', 'social', 'meeting']
const PRIORITIES = ['urgent', 'normal', 'low']
const CATEGORY_COLORS: Record<string, string> = {
  work: '#6c63ff', home: '#ff6584', gym: '#43b89c', social: '#ffb347', meeting: '#4da6ff'
}

function Auth({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    const { data, error } = await (isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password }))
    if (error) setError(error.message)
    else if (data.user) onLogin(data.user)
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1 style={{ textAlign: 'center', color: '#6c63ff' }}>📅 WeekFlow</h1>
      <p style={{ textAlign: 'center', color: '#aaa' }}>Plan your week. Own your time.</p>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
        style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 16, boxSizing: 'border-box' }} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
        style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 16, boxSizing: 'border-box' }} />
      {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}
      <button onClick={handleSubmit}
        style={{ width: '100%', padding: 12, borderRadius: 8, background: '#6c63ff', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16, marginBottom: 8 }}>
        {isSignUp ? 'Sign Up' : 'Log In'}
      </button>
      <p style={{ textAlign: 'center', fontSize: 14 }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: '#6c63ff', cursor: 'pointer' }}> {isSignUp ? 'Log In' : 'Sign Up'}</span>
      </p>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', category: 'work', priority: 'normal',
    scheduled_date: '', contact_name: '', contact_phone: '', contact_email: ''
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) fetchTasks()
  }, [user])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user!.id).order('scheduled_date')
    if (data) setTasks(data)
  }

  async function addTask() {
    if (!form.title.trim()) return
    const { data } = await supabase.from('tasks').insert({ ...form, user_id: user!.id, status: 'pending' }).select()
    if (data) setTasks([...tasks, data[0]])
    setForm({ title: '', description: '', category: 'work', priority: 'normal', scheduled_date: '', contact_name: '', contact_phone: '', contact_email: '' })
    setShowForm(false)
  }

  async function toggleStatus(task: Task) {
    const newStatus = task.status === 'pending' ? 'done' : 'pending'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100, fontFamily: 'sans-serif' }}>Loading...</div>
  if (!user) return <Auth onLogin={setUser} />

  const filtered = tasks.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (filterDate && t.scheduled_date !== filterDate) return false
    return true
  })

  const pending = filtered.filter(t => t.status === 'pending').length
  const done = filtered.filter(t => t.status === 'done').length

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', fontFamily: 'sans-serif', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#6c63ff', margin: 0 }}>📅 WeekFlow</h1>
        <button onClick={async () => { await supabase.auth.signOut(); setUser(null) }}
          style={{ background: 'none', border: '1px solid #ccc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
          Log out
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#f0eeff', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#6c63ff' }}>{pending}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Pending</div>
        </div>
        <div style={{ flex: 1, background: '#efffef', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#43b89c' }}>{done}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Done</div>
        </div>
        <div style={{ flex: 1, background: '#fff8ee', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ffb347' }}>{filtered.length}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Total</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }} />
        {filterDate && <button onClick={() => setFilterDate('')}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>Clear</button>}
      </div>

      {/* Add Task Button */}
      <button onClick={() => setShowForm(!showForm)}
        style={{ width: '100%', padding: 12, borderRadius: 8, background: '#6c63ff', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16, marginBottom: 16 }}>
        {showForm ? '✕ Cancel' : '+ Add Task'}
      </button>

      {/* Add Task Form */}
      {showForm && (
        <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title *"
            style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 15, boxSizing: 'border-box' }} />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)"
            style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box', resize: 'none', height: 70 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
            style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box' }} />
          <p style={{ fontSize: 13, color: '#888', margin: '8px 0 4px' }}>Contact (optional)</p>
          <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Contact name"
            style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="Phone"
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }} />
            <input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="Email"
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }} />
          </div>
          <button onClick={addTask}
            style={{ width: '100%', padding: 12, borderRadius: 8, background: '#43b89c', color: 'white', border: 'none', cursor: 'pointer', fontSize: 15 }}>
            Save Task
          </button>
        </div>
      )}

      {/* Task List */}
      {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#aaa' }}>No tasks yet! Add one above.</p>}
      {filtered.map(task => (
        <div key={task.id} style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${CATEGORY_COLORS[task.category] || '#6c63ff'}`, opacity: task.status === 'done' ? 0.6 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span onClick={() => toggleStatus(task)} style={{ cursor: 'pointer', fontSize: 18 }}>
                  {task.status === 'done' ? '✅' : '⬜'}
                </span>
                <span style={{ fontWeight: 600, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: '#333' }}>{task.title}</span>
              </div>
              {task.description && <p style={{ margin: '4px 0 4px 26px', fontSize: 13, color: '#666' }}>{task.description}</p>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 26 }}>
                <span style={{ background: CATEGORY_COLORS[task.category], color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{task.category}</span>
                <span style={{ background: task.priority === 'urgent' ? '#ff6584' : task.priority === 'normal' ? '#ffb347' : '#ccc', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{task.priority}</span>
                {task.scheduled_date && <span style={{ fontSize: 11, color: '#888', padding: '2px 0' }}>📅 {task.scheduled_date}</span>}
              </div>
              {/* Contact Actions */}
              {(task.contact_phone || task.contact_email) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 26 }}>
                  {task.contact_name && <span style={{ fontSize: 12, color: '#888' }}>👤 {task.contact_name}</span>}
                  {task.contact_phone && (
                    <a href={`tel:${task.contact_phone}`} style={{ fontSize: 12, color: '#6c63ff', textDecoration: 'none', background: '#f0eeff', padding: '3px 10px', borderRadius: 20 }}>📞 Call</a>
                  )}
                  {task.contact_email && (
                    <a href={`mailto:${task.contact_email}`} style={{ fontSize: 12, color: '#6c63ff', textDecoration: 'none', background: '#f0eeff', padding: '3px 10px', borderRadius: 20 }}>✉️ Email</a>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#ccc' }}>❌</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default App