"use client"

import { useState } from 'react'
import EntryPage from './entrypage/entrypage'
import AuthPage from './Authpage/authpage'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'projects', label: 'Projects', icon: '◈' },
  { id: 'tasks', label: 'Tasks', icon: '≡' },
  { id: 'schedule', label: 'Schedule', icon: '◷' },
  { id: 'budget', label: 'Budget', icon: '◎' },
  { id: 'reports', label: 'Reports', icon: '▤' },
]

const PROJECTS = [
  {
    id: 1,
    name: 'Westfield Tower A',
    type: 'High-Rise Residential',
    status: 'active',
    progress: 67,
    budget: 18400000,
    spent: 12320000,
    deadline: 'Nov 14, 2026',
    lead: 'D. Marchetti',
    crew: 84,
    phase: 'Structural',
    tasks: { done: 142, total: 212 },
    location: 'Chicago, IL',
  },
  {
    id: 2,
    name: 'Harbor Bridge Rehab',
    type: 'Civil Infrastructure',
    status: 'active',
    progress: 38,
    budget: 9200000,
    spent: 3496000,
    deadline: 'Mar 30, 2027',
    lead: 'R. Okonkwo',
    crew: 47,
    phase: 'Demolition',
    tasks: { done: 58, total: 151 },
    location: 'Portland, OR',
  },
  {
    id: 3,
    name: 'Greenfield Logistics Hub',
    type: 'Industrial / Warehouse',
    status: 'planning',
    progress: 12,
    budget: 6700000,
    spent: 804000,
    deadline: 'Aug 1, 2027',
    lead: 'S. Patel',
    crew: 22,
    phase: 'Site Prep',
    tasks: { done: 14, total: 118 },
    location: 'Columbus, OH',
  },
  {
    id: 4,
    name: 'Eastside Medical Center',
    type: 'Healthcare Facility',
    status: 'delayed',
    progress: 81,
    budget: 22100000,
    spent: 20394000,
    deadline: 'Sep 5, 2026',
    lead: 'T. Holloway',
    crew: 61,
    phase: 'Interior Fit-Out',
    tasks: { done: 203, total: 250 },
    location: 'Atlanta, GA',
  },
]

const TASKS = [
  { id: 1, project: 'Westfield Tower A', title: 'Pour 14th floor slab', priority: 'high', due: 'Aug 10', status: 'in-progress', assignee: 'Cruz, M.' },
  { id: 2, project: 'Harbor Bridge Rehab', title: 'Rebar inspection — north span', priority: 'critical', due: 'Aug 8', status: 'pending', assignee: 'Nguyen, T.' },
  { id: 3, project: 'Westfield Tower A', title: 'Window frame install — floors 10–12', priority: 'medium', due: 'Aug 15', status: 'in-progress', assignee: 'Park, J.' },
  { id: 4, project: 'Eastside Medical Center', title: 'HVAC unit testing — wing C', priority: 'high', due: 'Aug 9', status: 'pending', assignee: 'Rodriguez, A.' },
  { id: 5, project: 'Greenfield Logistics Hub', title: 'Soil compaction testing', priority: 'medium', due: 'Aug 12', status: 'done', assignee: 'Osei, K.' },
  { id: 6, project: 'Harbor Bridge Rehab', title: 'Traffic rerouting signage install', priority: 'low', due: 'Aug 11', status: 'done', assignee: 'Lin, W.' },
  { id: 7, project: 'Eastside Medical Center', title: 'Drywall — rooms 401–420', priority: 'high', due: 'Aug 7', status: 'overdue', assignee: 'Smith, D.' },
]

const CREW = [
  { name: 'D. Marchetti', role: 'Site Foreman', project: 'Westfield Tower A', shift: '06:00–14:00', status: 'on-site' },
  { name: 'R. Okonkwo', role: 'Project Lead', project: 'Harbor Bridge Rehab', shift: '07:00–15:00', status: 'on-site' },
  { name: 'Cruz, M.', role: 'Concrete Crew', project: 'Westfield Tower A', shift: '06:00–14:00', status: 'on-site' },
  { name: 'Nguyen, T.', role: 'Inspector', project: 'Harbor Bridge Rehab', shift: '08:00–16:00', status: 'en-route' },
  { name: 'Park, J.', role: 'Glazing Crew', project: 'Westfield Tower A', shift: '07:00–15:00', status: 'on-site' },
  { name: 'Rodriguez, A.', role: 'HVAC Technician', project: 'Eastside Medical Center', shift: '08:00–16:00', status: 'off-site' },
  { name: 'Smith, D.', role: 'Drywall Crew', project: 'Eastside Medical Center', shift: '06:00–14:00', status: 'on-site' },
  { name: 'Osei, K.', role: 'Surveyor', project: 'Greenfield Logistics Hub', shift: '09:00–17:00', status: 'on-site' },
]

const fmt = (n: number) =>
  n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`

const C = {
  bg: '#0F1115',
  surface: '#16181D',
  panel: '#2A2D34',
  border: '#3F434C',
  borderFaint: 'rgba(63,67,76,0.6)',
  brass: '#C9A15A',
  brassDim: 'rgba(201,161,90,0.1)',
  steel: '#4A7FA5',
  green: '#3a9e6e',
  red: '#D4772E',
  muted: 'rgba(228,229,231,0.28)',
  text: '#E4E5E7',
  textDim: 'rgba(228,229,231,0.5)',
  // aliases so existing JSX references compile
  get gold() { return this.brass },
  get goldDim() { return this.brassDim },
  get navy() { return '#16181D' },
  get navyMid() { return this.steel },
}

const statusMeta: Record<string, { color: string; label: string }> = {
  active: { color: C.green, label: 'Active' },
  planning: { color: C.navyMid, label: 'Planning' },
  delayed: { color: C.red, label: 'Delayed' },
}

const priorityMeta: Record<string, { color: string; dot: string }> = {
  critical: { color: C.red, dot: '●' },
  high: { color: C.gold, dot: '●' },
  medium: { color: C.navyMid, dot: '●' },
  low: { color: C.muted, dot: '●' },
}

const taskMeta: Record<string, { color: string; label: string }> = {
  'in-progress': { color: C.navyMid, label: 'In Progress' },
  pending: { color: C.gold, label: 'Pending' },
  done: { color: C.green, label: 'Done' },
  overdue: { color: C.red, label: 'Overdue' },
}

const crewMeta: Record<string, { color: string; label: string }> = {
  'on-site': { color: C.green, label: 'On-site' },
  'en-route': { color: C.gold, label: 'En route' },
  'off-site': { color: C.muted, label: 'Off-site' },
}

function Arc({ pct, size = 52, stroke = 3.5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const cx = size / 2
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(63,67,76,0.5)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={pct >= 90 ? C.red : pct >= 70 ? C.gold : C.green}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

function Bar({ pct, color = C.gold, h = 2 }: { pct: number; color?: string; h?: number }) {
  return (
    <div style={{ background: 'rgba(63,67,76,0.4)', borderRadius: 99, height: h, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.04em',
      color, background: color + '18', padding: '3px 9px', borderRadius: 99,
      border: `1px solid ${color}30`,
    }}>{label}</span>
  )
}

function Dashboard() {
  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0)
  const totalSpent = PROJECTS.reduce((s, p) => s + p.spent, 0)
  const activeCrew = CREW.filter(c => c.status === 'on-site').length
  const overdueTasks = TASKS.filter(t => t.status === 'overdue').length
  const avgProgress = Math.round(PROJECTS.reduce((s, p) => s + p.progress, 0) / PROJECTS.length)

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.gold, letterSpacing: '0.14em', marginBottom: 8, textTransform: 'uppercase' }}>
          Thu · Aug 7, 2026
        </p>
        <h1 style={{ fontFamily: 'Roboto Slab', fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Operations
        </h1>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Portfolio Value', value: fmt(totalBudget), sub: `${fmt(totalSpent)} deployed`, color: C.text },
          { label: 'Crew On-Site', value: `${activeCrew}`, sub: `${CREW.length} total assigned`, color: C.green },
          { label: 'Open Tasks', value: `${TASKS.filter(t => t.status !== 'done').length}`, sub: `${overdueTasks} overdue`, color: overdueTasks > 0 ? C.red : C.text },
          { label: 'Avg. Progress', value: `${avgProgress}%`, sub: 'across all projects', color: C.gold },
        ].map(k => (
          <div key={k.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontFamily: 'Work Sans', fontSize: 12, color: C.textDim, marginBottom: 12, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontFamily: 'Roboto Slab', fontSize: 32, fontWeight: 700, color: k.color, lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.muted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        {/* Project progress */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 600, color: C.text }}>Projects</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.gold }}>4 active</span>
          </div>
          {PROJECTS.map((p, i) => (
            <div key={p.id} style={{ padding: '16px 22px', borderBottom: i < PROJECTS.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', gap: 16, alignItems: 'center' }}>
              <Arc pct={p.progress} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 600, color: C.text }}>{p.name}</span>
                  <Chip label={statusMeta[p.status].label} color={statusMeta[p.status].color} />
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>
                  {p.phase} · {p.location} · {p.crew} crew
                </div>
              </div>
              <div style={{ fontFamily: 'Roboto Slab', fontSize: 18, fontWeight: 700, color: p.status === 'delayed' ? C.red : C.gold, minWidth: 42, textAlign: 'right' }}>
                {p.progress}%
              </div>
            </div>
          ))}
        </div>

        {/* Budget snapshot */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 600, color: C.text }}>Budget</span>
          </div>
          {PROJECTS.map((p, i) => {
            const pct = Math.round((p.spent / p.budget) * 100)
            const barColor = pct > 90 ? C.red : pct > 75 ? C.gold : C.green
            return (
              <div key={p.id} style={{ padding: '16px 22px', borderBottom: i < PROJECTS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div className="flex justify-between items-baseline mb-2">
                  <span style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: barColor, fontWeight: 600 }}>{pct}%</span>
                </div>
                <Bar pct={pct} color={barColor} h={3} />
                <div className="flex justify-between mt-2">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>{fmt(p.spent)} spent</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.muted }}>{fmt(p.budget)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent tasks */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 600, color: C.text }}>Recent Tasks</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.gold, cursor: 'pointer' }}>View all →</span>
        </div>
        {TASKS.slice(0, 5).map((t, i) => {
          const p = priorityMeta[t.priority]
          const s = taskMeta[t.status]
          return (
            <div key={t.id} className="flex items-center gap-4"
              style={{ padding: '14px 22px', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ color: p.color, fontSize: 8, flexShrink: 0 }}>{p.dot}</span>
              <span style={{ fontFamily: 'Work Sans', fontSize: 13, color: C.text, flex: 1, fontWeight: 500 }}>{t.title}</span>
              <span style={{ fontFamily: 'Work Sans', fontSize: 12, color: C.textDim, width: 160, flexShrink: 0 }}>{t.project}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim, width: 72, flexShrink: 0 }}>{t.assignee.split(',')[0]}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.status === 'overdue' ? C.red : C.textDim, width: 52, flexShrink: 0 }}>{t.due}</span>
              <Chip label={s.label} color={s.color} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Projects() {
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.gold, letterSpacing: '0.14em', marginBottom: 8, textTransform: 'uppercase' }}>Portfolio</p>
        <h1 style={{ fontFamily: 'Roboto Slab', fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Projects</h1>
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {PROJECTS.map(p => {
          const spentPct = Math.round((p.spent / p.budget) * 100)
          const sm = statusMeta[p.status]
          return (
            <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}
              className="hover:bg-white/[0.02] transition-colors">
              <div style={{ padding: '22px 24px', borderBottom: `1px solid ${C.border}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div style={{ fontFamily: 'Roboto Slab', fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>{p.type} · {p.location}</div>
                  </div>
                  <Chip label={sm.label} color={sm.color} />
                </div>
              </div>
              <div style={{ padding: '22px 24px' }}>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Budget', value: fmt(p.budget) },
                    { label: 'Crew', value: `${p.crew}` },
                    { label: 'Deadline', value: p.deadline },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontFamily: 'Work Sans', fontSize: 11, color: C.textDim, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: C.text, fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-6 mb-5">
                  <div style={{ flex: 1 }}>
                    <div className="flex justify-between mb-2">
                      <span style={{ fontFamily: 'Work Sans', fontSize: 11, color: C.textDim }}>Progress</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: p.status === 'delayed' ? C.red : C.gold, fontWeight: 600 }}>{p.progress}%</span>
                    </div>
                    <Bar pct={p.progress} color={p.status === 'delayed' ? C.red : C.gold} h={3} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex justify-between mb-2">
                      <span style={{ fontFamily: 'Work Sans', fontSize: 11, color: C.textDim }}>Budget used</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: spentPct > 90 ? C.red : C.green, fontWeight: 600 }}>{spentPct}%</span>
                    </div>
                    <Bar pct={spentPct} color={spentPct > 90 ? C.red : spentPct > 75 ? C.gold : C.green} h={3} />
                  </div>
                </div>

                <div className="flex justify-between">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>Lead · {p.lead}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>Phase · {p.phase}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>Tasks · {p.tasks.done}/{p.tasks.total}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Tasks() {
  const [filter, setFilter] = useState('all')
  const filters = ['all', 'pending', 'in-progress', 'overdue', 'done']
  const visible = filter === 'all' ? TASKS : TASKS.filter(t => t.status === filter)

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.gold, letterSpacing: '0.14em', marginBottom: 8, textTransform: 'uppercase' }}>Work Items</p>
        <h1 style={{ fontFamily: 'Roboto Slab', fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Tasks</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              fontFamily: 'Work Sans', fontSize: 12, fontWeight: filter === f ? 600 : 400,
              padding: '7px 16px', borderRadius: 99, border: '1px solid',
              borderColor: filter === f ? C.gold + '60' : C.border,
              background: filter === f ? C.goldDim : 'transparent',
              color: filter === f ? C.gold : C.textDim,
              cursor: 'pointer', transition: 'all 0.15s ease',
              textTransform: 'capitalize',
            }}>
            {f.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '16px 2fr 1.3fr 100px 70px 110px', gap: 16, padding: '10px 22px', borderBottom: `1px solid ${C.border}` }}>
          {['', 'Task', 'Project', 'Assignee', 'Due', 'Status'].map(h => (
            <div key={h} style={{ fontFamily: 'Work Sans', fontSize: 11, color: C.muted, fontWeight: 500 }}>{h}</div>
          ))}
        </div>
        {visible.map((t, i) => {
          const p = priorityMeta[t.priority]
          const s = taskMeta[t.status]
          return (
            <div key={t.id}
              style={{ display: 'grid', gridTemplateColumns: '16px 2fr 1.3fr 100px 70px 110px', gap: 16, padding: '15px 22px', borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}
              className="hover:bg-white/[0.03] transition-colors cursor-pointer">
              <span style={{ color: p.color, fontSize: 7 }}>{p.dot}</span>
              <span style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 500, color: C.text }}>{t.title}</span>
              <span style={{ fontFamily: 'Work Sans', fontSize: 12, color: C.textDim }}>{t.project}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.textDim }}>{t.assignee}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.status === 'overdue' ? C.red : C.textDim }}>{t.due}</span>
              <Chip label={s.label} color={s.color} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Schedule() {
  const onSite = CREW.filter(c => c.status === 'on-site').length
  const enRoute = CREW.filter(c => c.status === 'en-route').length
  const offSite = CREW.filter(c => c.status === 'off-site').length

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.gold, letterSpacing: '0.14em', marginBottom: 8, textTransform: 'uppercase' }}>Today · Aug 7</p>
        <h1 style={{ fontFamily: 'Roboto Slab', fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Crew Schedule</h1>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'On-site', count: onSite, color: C.green },
          { label: 'En route', count: enRoute, color: C.gold },
          { label: 'Off-site', count: offSite, color: C.muted },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
            <div style={{ fontFamily: 'Roboto Slab', fontSize: 40, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.count}</div>
            <div style={{ fontFamily: 'Work Sans', fontSize: 12, color: C.textDim }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1.6fr 1fr 0.8fr', gap: 16, padding: '10px 22px', borderBottom: `1px solid ${C.border}` }}>
          {['Name', 'Role', 'Project', 'Shift', 'Status'].map(h => (
            <div key={h} style={{ fontFamily: 'Work Sans', fontSize: 11, color: C.muted, fontWeight: 500 }}>{h}</div>
          ))}
        </div>
        {CREW.map((c, i) => {
          const st = crewMeta[c.status]
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1.6fr 1fr 0.8fr', gap: 16, padding: '15px 22px', borderBottom: i < CREW.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}
              className="hover:bg-white/[0.03] transition-colors">
              <span style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</span>
              <span style={{ fontFamily: 'Work Sans', fontSize: 12, color: C.textDim }}>{c.role}</span>
              <span style={{ fontFamily: 'Work Sans', fontSize: 12, color: C.textDim }}>{c.project}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.textDim }}>{c.shift}</span>
              <Chip label={st.label} color={st.color} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Budget() {
  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0)
  const totalSpent = PROJECTS.reduce((s, p) => s + p.spent, 0)

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.gold, letterSpacing: '0.14em', marginBottom: 8, textTransform: 'uppercase' }}>FY 2026</p>
        <h1 style={{ fontFamily: 'Roboto Slab', fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Budget</h1>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Portfolio Total', value: fmt(totalBudget), color: C.text },
          { label: 'Deployed', value: fmt(totalSpent), sub: `${Math.round((totalSpent / totalBudget) * 100)}% utilized`, color: C.gold },
          { label: 'Remaining', value: fmt(totalBudget - totalSpent), color: C.green },
        ].map(k => (
          <div key={k.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
            <div style={{ fontFamily: 'Work Sans', fontSize: 12, color: C.textDim, marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontFamily: 'Roboto Slab', fontSize: 34, fontWeight: 700, color: k.color, lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            {k.sub && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.muted }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 600, color: C.text }}>Breakdown by Project</span>
        </div>
        {PROJECTS.map((p, i) => {
          const pct = Math.round((p.spent / p.budget) * 100)
          const barColor = pct > 90 ? C.red : pct > 75 ? C.gold : C.green
          const healthLabel = pct > 90 ? 'Over' : pct > 75 ? 'Watch' : 'OK'
          return (
            <div key={p.id} style={{ padding: '20px 22px', borderBottom: i < PROJECTS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div style={{ fontFamily: 'Work Sans', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>Deadline · {p.deadline}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: C.text, fontWeight: 600 }}>{fmt(p.spent)}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.muted }}>of {fmt(p.budget)}</div>
                  </div>
                  <Chip label={healthLabel} color={barColor} />
                </div>
              </div>
              <Bar pct={pct} color={barColor} h={3} />
              <div className="flex justify-between mt-2">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>{pct}% utilized</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.green }}>{fmt(p.budget - p.spent)} remaining</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Reports() {
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.gold, letterSpacing: '0.14em', marginBottom: 8, textTransform: 'uppercase' }}>Week of Aug 4–8</p>
        <h1 style={{ fontFamily: 'Roboto Slab', fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>Reports</h1>
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {PROJECTS.map(p => (
          <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px' }}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <div style={{ fontFamily: 'Roboto Slab', fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.textDim }}>{p.type}</div>
              </div>
              <Chip label={statusMeta[p.status].label} color={statusMeta[p.status].color} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { label: 'Tasks Done', value: `${p.tasks.done} / ${p.tasks.total}` },
                { label: 'Budget Used', value: `${Math.round((p.spent / p.budget) * 100)}%` },
                { label: 'Crew Size', value: `${p.crew} workers` },
                { label: 'Current Phase', value: p.phase },
              ].map(item => (
                <div key={item.label} style={{ background: C.panel, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'Work Sans', fontSize: 11, color: C.textDim, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: C.text, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span style={{ fontFamily: 'Work Sans', fontSize: 11, color: C.textDim }}>Overall progress</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: p.status === 'delayed' ? C.red : C.gold, fontWeight: 600 }}>{p.progress}%</span>
              </div>
              <Bar pct={p.progress} color={p.status === 'delayed' ? C.red : C.gold} h={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<'entry' | 'auth' | 'app'>('entry')
  const [activeNav, setActiveNav] = useState('dashboard')

  if (screen === 'entry') return <EntryPage onEnter={() => setScreen('auth')} />
  if (screen === 'auth') return <AuthPage onEnter={() => setScreen('app')} />

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard': return <Dashboard />
      case 'projects': return <Projects />
      case 'tasks': return <Tasks />
      case 'schedule': return <Schedule />
      case 'budget': return <Budget />
      case 'reports': return <Reports />
      default: return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      {/* Sidebar */}
      <aside style={{
        width: 232, minWidth: 232,
        background: C.navy,
        borderRight: 'none',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '30px 24px 26px', borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <div style={{ width: 3, height: 22, background: C.brass, borderRadius: 99 }} />
            <span style={{ fontFamily: 'Roboto Slab', fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
              Apex <span style={{ color: C.brass }}>Developments</span>
            </span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: C.muted, letterSpacing: '0.18em', paddingLeft: 15 }}>CONSTRUCTION OS</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '18px 14px', flex: 1 }}>
          {NAV.map(item => {
            const active = activeNav === item.id
            return (
              <button key={item.id} onClick={() => setActiveNav(item.id)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11,
                  padding: '10px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  marginBottom: 2, transition: 'all 0.15s ease',
                  background: active ? C.brassDim : 'transparent',
                  borderLeft: active ? `2px solid ${C.brass}` : '2px solid transparent',
                }}>
                <span style={{ color: active ? C.brass : C.muted, fontSize: 13 }}>{item.icon}</span>
                <span style={{
                  fontFamily: 'Work Sans', fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? C.text : C.textDim,
                }}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Portfolio health */}
        <div style={{ padding: '20px 24px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: 'Work Sans', fontSize: 11, color: C.muted, marginBottom: 12, letterSpacing: '0.02em' }}>Portfolio health</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {PROJECTS.map(p => (
              <div key={p.id} style={{ background: C.panel, borderRadius: 4, padding: '9px 10px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: C.muted, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name.split(' ')[0]}</div>
                <Bar pct={p.progress} color={p.status === 'delayed' ? C.red : C.brass} h={2} />
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: C.muted, letterSpacing: '0.06em' }}>4 PROJECTS · 214 CREW</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px 44px', overflowY: 'auto', maxWidth: 1100 }}>
        {renderContent()}
      </main>
    </div>
  )
}
