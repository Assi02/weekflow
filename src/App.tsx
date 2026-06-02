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
const EMPTY_FORM = {
  title: '', description: '', category: 'work', priority: 'normal',
  scheduled_date: '', contact_name: '', contact_phone: '', contact_email: ''
}
const TEMPLATES: Record<string, { title: string, description: string }[]> = {
  gym: [
    { title: 'Leg Day', description: 'Squats, lunges, leg press' },
    { title: 'Chest Day', description: 'Bench press, push-ups, flyes' },
    { title: 'Back Day', description: 'Deadlifts, rows, pull-ups' },
    { title: 'Arm Day', description: 'Biceps, triceps, shoulders' },
    { title: 'Cardio', description: '30 min run or cycling' },
  ],
  work: [
    { title: 'Team Meeting', description: 'Discuss progress and blockers' },
    { title: 'Client Call', description: 'Follow up with client' },
    { title: 'Report Submission', description: 'Submit weekly report' },
    { title: 'Email Follow-up', description: 'Follow up on pending emails' },
  ],
  home: [
    { title: 'Grocery Shopping', description: 'Buy weekly groceries' },
    { title: 'House Cleaning', description: 'Clean and organize home' },
    { title: 'Bill Payment', description: 'Pay monthly bills' },
  ],
  social: [
    { title: 'Meet Friends', description: 'Catch up with friends' },
    { title: 'Family Dinner', description: 'Dinner with family' },
    { title: 'Call Parents', description: 'Weekly call with parents' },
  ],
  meeting: [
    { title: 'Project Review', description: 'Review project status' },
    { title: 'Interview', description: 'Candidate interview' },
    { title: 'Presentation', description: 'Present to stakeholders' },
  ],
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

function getWeekDays(offset: number) {
  const days = []
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

function TaskForm({ form, setForm, editingTask, saveTask, onCancel }: {
  form: typeof EMPTY_FORM
  setForm: (f: typeof EMPTY_FORM) => void
  editingTask: Task | null
  saveTask: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 12px', color: '#6c63ff' }}>{editingTask ? '✏️ Edit Task' : '➕ New Task'}</h3>

      {/* Quick Templates */}
      {!editingTask && TEMPLATES[form.category] && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 6px' }}>⚡ Quick templates:</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TEMPLATES[form.category].map((t, i) => (
              <span key={i} onClick={() => setForm({ ...form, title: t.title, description: t.description })}
                style={{ fontSize: 12, background: '#f0eeff', color: '#6c63ff', padding: '4px 10px', borderRadius: 20, cursor: 'pointer', border: '1px solid #e0dcff' }}>
                {t.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title *"
        style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 15, boxSizing: 'border-box' }} />
      <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description"
        style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box', resize: 'none', height: 60 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, title: '', description: '' })}
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
      <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Contact name"
        style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: '1px solid #ccc', fontSize: 14, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="Phone"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }} />
        <input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} placeholder="Email"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={saveTask}
          style={{ flex: 1, padding: 12, borderRadius: 8, background: '#43b89c', color: 'white', border: 'none', cursor: 'pointer', fontSize: 15 }}>
          {editingTask ? '💾 Save Changes' : '✅ Add Task'}
        </button>
        <button onClick={onCancel}
          style={{ padding: 12, borderRadius: 8, background: '#ff6584', color: 'white', border: 'none', cursor: 'pointer', fontSize: 15 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function TaskCard({ task, toggleStatus, startEdit, deleteTask }: {
  task: Task
  toggleStatus: (t: Task) => void
  startEdit: (t: Task) => void
  deleteTask: (id: string) => void
}) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${CATEGORY_COLORS[task.category] || '#6c63ff'}`, opacity: task.status === 'done' ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span onClick={() => toggleStatus(task)} style={{ cursor: 'pointer', fontSize: 18 }}>{task.status === 'done' ? '✅' : '⬜'}</span>
            <span style={{ fontWeight: 600, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: '#333' }}>{task.title}</span>
          </div>
          {task.description && <p style={{ margin: '4px 0 4px 26px', fontSize: 13, color: '#666' }}>{task.description}</p>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 26 }}>
            <span style={{ background: CATEGORY_COLORS[task.category], color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{task.category}</span>
            <span style={{ background: task.priority === 'urgent' ? '#ff6584' : task.priority === 'normal' ? '#ffb347' : '#ccc', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{task.priority}</span>
            {task.scheduled_date && <span style={{ fontSize: 11, color: '#888' }}>📅 {task.scheduled_date}</span>}
          </div>
          {(task.contact_phone || task.contact_email) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 26, flexWrap: 'wrap' }}>
              {task.contact_name && <span style={{ fontSize: 12, color: '#888' }}>👤 {task.contact_name}</span>}
              {task.contact_phone && <a href={`tel:${task.contact_phone}`} style={{ fontSize: 12, color: '#6c63ff', textDecoration: 'none', background: '#f0eeff', padding: '3px 10px', borderRadius: 20 }}>📞 Call</a>}
              {task.contact_email && <a href={`mailto:${task.contact_email}`} style={{ fontSize: 12, color: '#6c63ff', textDecoration: 'none', background: '#f0eeff', padding: '3px 10px', borderRadius: 20 }}>✉️ Email</a>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => startEdit(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✏️</button>
          <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>❌</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'week'>('list')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filterCat, setFilterCat] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [notifPermission, setNotifPermission] = useState(Notification.permission)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUser(data.session.user)
      setLoading(false)
    })
  }, [])

  useEffect(() => { if (user) fetchTasks() }, [user])

  useEffect(() => {
    if (tasks.length > 0 && notifPermission === 'granted') checkReminders(tasks)
  }, [tasks, notifPermission])

  function checkReminders(tasks: Task[]) {
    const today = fmt(new Date())
    const tomorrow = fmt(new Date(Date.now() + 86400000))
    tasks.filter(t => t.status === 'pending').forEach(task => {
      if (task.scheduled_date === today)
        new Notification(`📅 Due Today: ${task.title}`, { body: `${task.category} | ${task.priority}` })
      else if (task.scheduled_date === tomorrow)
        new Notification(`⏰ Due Tomorrow: ${task.title}`, { body: `${task.category} | ${task.priority}` })
    })
  }

  async function requestNotifications() {
    const permission = await Notification.requestPermission()
    setNotifPermission(permission)
    if (permission === 'granted') {
      new Notification('🎉 WeekFlow Notifications Enabled!', { body: "You'll be reminded about tasks due today and tomorrow." })
      checkReminders(tasks)
    }
  }

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user!.id).order('scheduled_date')
    if (data) setTasks(data)
  }

  async function saveTask() {
    if (!form.title.trim()) return
    if (editingTask) {
      await supabase.from('tasks').update(form).eq('id', editingTask.id)
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...form } : t))
    } else {
      const { data } = await supabase.from('tasks').insert({ ...form, user_id: user!.id, status: 'pending' }).select()
      if (data) setTasks([...tasks, data[0]])
    }
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditingTask(null)
  }

  function startEdit(task: Task) {
    setEditingTask(task)
    setForm({
      title: task.title, description: task.description, category: task.category,
      priority: task.priority, scheduled_date: task.scheduled_date,
      contact_name: task.contact_name, contact_phone: task.contact_phone, contact_email: task.contact_email,
    })
    setShowForm(true)
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

  const pending = tasks.filter(t => t.status === 'pending').length
  const done = tasks.filter(t => t.status === 'done').length
  const weekDays = getWeekDays(weekOffset)
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = fmt(new Date())

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', fontFamily: 'sans-serif', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#6c63ff', margin: 0 }}>📅 WeekFlow</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {notifPermission !== 'granted' && (
            <button onClick={requestNotifications}
              style={{ background: '#fff8ee', border: '1px solid #ffb347', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#ffb347' }}>
              🔔 Enable Alerts
            </button>
          )}
          {notifPermission === 'granted' && <span style={{ fontSize: 13, color: '#43b89c', padding: '6px 0' }}>🔔 Alerts ON</span>}
          <button onClick={async () => { await supabase.auth.signOut(); setUser(null) }}
            style={{ background: 'none', border: '1px solid #ccc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>Log out</button>
        </div>
      </div>

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
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ffb347' }}>{tasks.length}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Total</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setView('list')}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, background: view === 'list' ? '#6c63ff' : '#f0f0f0', color: view === 'list' ? 'white' : '#333' }}>
          📋 List View
        </button>
        <button onClick={() => setView('week')}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, background: view === 'week' ? '#6c63ff' : '#f0f0f0', color: view === 'week' ? 'white' : '#333' }}>
          📅 Week View
        </button>
      </div>

      <button onClick={() => { setShowForm(!showForm); setEditingTask(null); setForm(EMPTY_FORM) }}
        style={{ width: '100%', padding: 12, borderRadius: 8, background: '#6c63ff', color: 'white', border: 'none', cursor: 'pointer', fontSize: 16, marginBottom: 16 }}>
        {showForm && !editingTask ? '✕ Cancel' : '+ Add Task'}
      </button>

      {showForm && <TaskForm form={form} setForm={setForm} editingTask={editingTask} saveTask={saveTask} onCancel={() => { setShowForm(false); setEditingTask(null); setForm(EMPTY_FORM) }} />}

      {view === 'list' && (
        <>
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
          {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#aaa' }}>No tasks yet!</p>}
          {filtered.map(task => <TaskCard key={task.id} task={task} toggleStatus={toggleStatus} startEdit={startEdit} deleteTask={deleteTask} />)}
        </>
      )}

      {view === 'week' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button onClick={() => setWeekOffset(w => w - 1)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontSize: 16 }}>←</button>
            <span style={{ fontWeight: 600, color: '#333', fontSize: 14 }}>
              {weekDays[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontSize: 16 }}>→</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
            {weekDays.map((day, i) => {
              const d = fmt(day)
              const count = tasks.filter(t => t.scheduled_date === d).length
              const isToday = d === today
              const isSelected = selectedDate === d
              return (
                <div key={d} onClick={() => setSelectedDate(isSelected ? null : d)}
                  style={{ flex: '0 0 auto', textAlign: 'center', padding: '8px 10px', borderRadius: 10, cursor: 'pointer', minWidth: 48,
                    background: isSelected ? '#6c63ff' : isToday ? '#f0eeff' : '#f9f9f9',
                    border: isToday ? '2px solid #6c63ff' : '2px solid transparent',
                    color: isSelected ? 'white' : '#333' }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{DAY_NAMES[i]}</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{day.getDate()}</div>
                  {count > 0 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? 'white' : '#6c63ff', margin: '2px auto 0' }} />}
                </div>
              )
            })}
          </div>
          {selectedDate ? (
            <>
              <p style={{ fontWeight: 600, color: '#6c63ff', marginBottom: 8 }}>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {tasks.filter(t => t.scheduled_date === selectedDate).length === 0
                ? <p style={{ textAlign: 'center', color: '#aaa' }}>No tasks for this day!</p>
                : tasks.filter(t => t.scheduled_date === selectedDate).map(task => <TaskCard key={task.id} task={task} toggleStatus={toggleStatus} startEdit={startEdit} deleteTask={deleteTask} />)
              }
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#aaa' }}>👆 Tap a day to see tasks</p>
          )}
        </>
      )}
    </div>
  )
}

export default App