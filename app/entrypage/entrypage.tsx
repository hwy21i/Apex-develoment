"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

const P = {
  bg: '#0F1115',
  nav: '#16181D',
  panel: '#2A2D34',
  border: '#3F434C',
  brass: '#C9A15A',
  brassDim: 'rgba(201,161,90,0.1)',
  brassGlow: 'rgba(201,161,90,0.18)',
  rust: '#D4772E',
  green: '#3a9e6e',
  text: '#E4E5E7',
  textDim: 'rgba(228,229,231,0.52)',
  textMuted: 'rgba(228,229,231,0.28)',
}

const STATS = [
  { value: '214', label: 'Crew Deployed' },
  { value: '$56.4M', label: 'Portfolio Value' },
  { value: '4', label: 'Active Projects' },
  { value: '98%', label: 'On-Time Delivery' },
]

const FEATURES = [
  {
    icon: '◈',
    title: 'Project Command',
    body: 'Full-spectrum project oversight from groundbreaking to handover. Track phases, milestones, and crew across every site in one view.',
  },
  {
    icon: '◎',
    title: 'Budget Intelligence',
    body: 'Real-time spend tracking against approved budgets. Forecast overruns before they occur with automated utilization alerts.',
  },
  {
    icon: '◷',
    title: 'Crew Scheduling',
    body: 'Assign, track, and coordinate field crews across multiple sites. Live on-site status and shift management built in.',
  },
  {
    icon: '▤',
    title: 'Executive Reports',
    body: 'Board-ready summaries generated from live project data. One source of truth for leadership, clients, and site leads.',
  },
]

const PROJECTS_PREVIEW = [
  { name: 'Westfield Tower A', type: 'High-Rise Residential', progress: 67, status: 'On Track' },
  { name: 'Harbor Bridge Rehab', type: 'Civil Infrastructure', progress: 38, status: 'On Track' },
  { name: 'Eastside Medical Center', type: 'Healthcare Facility', progress: 81, status: 'Delayed' },
]

function Bar({ pct, color = P.brass }: { pct: number; color?: string }) {
  return (
    <div style={{ background: 'rgba(63,67,76,0.5)', borderRadius: 99, height: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 99 }} />
    </div>
  )
}

export default function EntryPage({ onEnter }: { onEnter: () => void }) {
  const [visible, setVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll) }
  }, [])

  const btnPrimary: React.CSSProperties = {
    fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontWeight: 700,
    color: '#0F1115', background: P.brass,
    border: 'none', borderRadius: 6, padding: '13px 30px',
    cursor: 'pointer', letterSpacing: '0.01em',
    transition: 'all 0.18s ease',
    boxShadow: `0 6px 24px ${P.brassGlow}`,
  }

  const btnSecondary: React.CSSProperties = {
    fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontWeight: 500,
    color: P.textDim, background: 'transparent',
    border: `1px solid ${P.border}`, borderRadius: 6, padding: '13px 26px',
    cursor: 'pointer', transition: 'border-color 0.18s ease, color 0.18s ease',
  }

  return (
    <div style={{ background: P.bg, minHeight: '100vh', fontFamily: 'Work Sans, sans-serif', color: P.text }}>

      {/* NAV */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(22,24,29,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${P.border}` : 'none',
        transition: 'all 0.3s ease',
        padding: '0 48px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 66 }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 3, height: 20, background: P.brass, borderRadius: 99 }} />
            <span style={{ fontFamily: 'Roboto Slab, serif', fontSize: 15, fontWeight: 700, color: P.text, letterSpacing: '-0.01em' }}>
              Apex <span style={{ color: P.brass }}>Developments</span>
            </span>
          </div>
          <nav className="flex items-center gap-8">
            {[['Platform', '/platform'], ['Projects', '/projects'], ['About', '/about']].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontFamily: 'Work Sans', fontSize: 13, color: P.textDim, textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.color = P.text)}
                onMouseOut={e => (e.currentTarget.style.color = P.textDim)}>{label}</Link>
            ))}
            <button onClick={onEnter} style={{ ...btnPrimary, padding: '9px 20px', fontSize: 13 }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
              Open Dashboard
            </button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: P.nav }}>
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(https://images.unsplash.com/photo-1585845597736-1f8a8a68c912?w=1800&h=1200&fit=crop&auto=format)`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          opacity: 0.12,
        }} />
        {/* Blueprint grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(201,161,90,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,161,90,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }} />
        {/* Gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(105deg, ${P.nav} 40%, rgba(22,24,29,0.75) 65%, rgba(22,24,29,0.35) 100%)`,
        }} />
        {/* Brass top rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${P.brass} 0%, transparent 60%)` }} />

        <div style={{
          position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '130px 48px 110px',
          width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center',
        }}>
          {/* Left */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition: 'all 0.8s ease' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: `1px solid rgba(201,161,90,0.3)`, borderRadius: 99,
              padding: '5px 14px', marginBottom: 32,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: 99, background: P.brass }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.brass, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Construction Operations Platform
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Roboto Slab, serif', fontSize: 56, fontWeight: 700, color: P.text,
              lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24,
            }}>
              Built for those<br />
              who <span style={{ color: P.brass }}>build</span><br />
              the world.
            </h1>

            <p style={{ fontSize: 16, color: P.textDim, lineHeight: 1.75, marginBottom: 40, maxWidth: 430 }}>
              Apex Developments unifies project management, budget intelligence, and crew coordination into one executive-grade platform — purpose-built for construction at scale.
            </p>

            <div className="flex items-center gap-4">
              <button onClick={onEnter} style={btnPrimary}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 10px 32px ${P.brassGlow}` }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 6px 24px ${P.brassGlow}` }}>
                Enter Dashboard →
              </button>
              <Link href="/demo" style={{ ...btnSecondary, display: 'inline-flex', alignItems: 'center' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = P.brass; e.currentTarget.style.color = P.text }}
                onMouseOut={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.textDim }}>
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Right — live project preview */}
          <div style={{
            opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)',
            transition: 'all 0.9s ease 0.18s',
          }}>
            <div style={{
              background: 'rgba(42,45,52,0.7)',
              border: `1px solid ${P.border}`,
              borderRadius: 12, overflow: 'hidden',
              backdropFilter: 'blur(24px)',
            }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.textMuted, letterSpacing: '0.14em' }}>LIVE PORTFOLIO</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.brass }}>● LIVE</span>
              </div>
              {PROJECTS_PREVIEW.map((p, i) => (
                <div key={i} style={{ padding: '16px 20px', borderBottom: i < PROJECTS_PREVIEW.length - 1 ? `1px solid rgba(63,67,76,0.5)` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: 'Work Sans', fontSize: 13, fontWeight: 600, color: P.text, marginBottom: 3 }}>{p.name}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.textMuted }}>{p.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: p.status === 'Delayed' ? P.rust : P.brass }}>{p.progress}%</span>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                        color: p.status === 'Delayed' ? P.rust : P.green,
                        background: p.status === 'Delayed' ? 'rgba(212,119,46,0.12)' : 'rgba(58,158,110,0.12)',
                        padding: '2px 8px', borderRadius: 99,
                        border: `1px solid ${p.status === 'Delayed' ? 'rgba(212,119,46,0.3)' : 'rgba(58,158,110,0.3)'}`,
                      }}>{p.status}</span>
                    </div>
                  </div>
                  <Bar pct={p.progress} color={p.status === 'Delayed' ? P.rust : P.brass} />
                </div>
              ))}
              <div style={{ padding: '13px 20px', background: 'rgba(201,161,90,0.06)', display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${P.border}` }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.textMuted }}>4 projects · 214 crew</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.brass }}>$56.4M portfolio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.textMuted, letterSpacing: '0.2em' }}>SCROLL</span>
          <div style={{ width: 1, height: 36, background: `linear-gradient(to bottom, ${P.brass}60, transparent)` }} />
        </div>
      </section>

      {/* STATS BAND */}
      <section style={{ background: P.panel, borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}`, padding: '0 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '36px 0', textAlign: 'center',
              borderRight: i < STATS.length - 1 ? `1px solid ${P.border}` : 'none',
            }}>
              <div style={{ fontFamily: 'Roboto Slab, serif', fontSize: 38, fontWeight: 700, color: P.brass, lineHeight: 1, marginBottom: 7 }}>{s.value}</div>
              <div style={{ fontFamily: 'Work Sans', fontSize: 12, color: P.textDim, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 48px', background: P.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ maxWidth: 560, marginBottom: 68 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.brass, letterSpacing: '0.2em', marginBottom: 16, textTransform: 'uppercase' }}>Platform</div>
            <h2 style={{ fontFamily: 'Roboto Slab, serif', fontSize: 40, fontWeight: 700, color: P.text, letterSpacing: '-0.02em', lineHeight: 1.12, marginBottom: 18 }}>
              Every tool a<br />project lead needs.
            </h2>
            <p style={{ fontSize: 15, color: P.textDim, lineHeight: 1.75 }}>
              From first excavation to final inspection, Apex Developments gives your team the intelligence to deliver on time, on budget, and on brief.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: P.border, border: `1px solid ${P.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {FEATURES.map((f, i) => (
              <div key={i}
                style={{
                  padding: '44px 48px',
                  background: i % 2 === 0 ? P.nav : P.panel,
                  transition: 'background 0.18s ease',
                  cursor: 'default',
                }}
                onMouseOver={e => (e.currentTarget.style.background = P.panel)}
                onMouseOut={e => (e.currentTarget.style.background = i % 2 === 0 ? P.nav : P.panel)}>
                <div style={{ fontFamily: 'Roboto Slab, serif', fontSize: 26, color: P.brass, marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Roboto Slab, serif', fontSize: 18, fontWeight: 700, color: P.text, marginBottom: 12, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: P.textDim }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FULL-WIDTH IMAGE */}
      <section style={{ position: 'relative', height: 420, overflow: 'hidden', background: P.nav }}>
        <img
          src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1800&h=600&fit=crop&auto=format"
          alt="Construction crew on site"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to right, ${P.nav} 0%, rgba(22,24,29,0.4) 50%, ${P.nav} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: '0 48px',
        }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.brass, letterSpacing: '0.22em', marginBottom: 20, textTransform: 'uppercase' }}>Est. 2020</div>
          <blockquote style={{
            fontFamily: 'Roboto Slab, serif', fontSize: 28, fontWeight: 400,
            color: P.text, maxWidth: 680, lineHeight: 1.45,
            fontStyle: 'italic', letterSpacing: '-0.01em',
          }}>
            "The difference between a good project and a great one is the intelligence behind every decision."
          </blockquote>
          <div style={{ marginTop: 22, fontFamily: 'Work Sans', fontSize: 12, color: P.textMuted }}>— D. Marchetti, Site Foreman · Westfield Tower A</div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 48px', background: P.panel, borderTop: `1px solid ${P.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.brass, letterSpacing: '0.2em', marginBottom: 20, textTransform: 'uppercase' }}>Get Started</div>
            <h2 style={{ fontFamily: 'Roboto Slab, serif', fontSize: 44, fontWeight: 700, color: P.text, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 22 }}>
              Ready to take<br />command?
            </h2>
            <p style={{ fontSize: 15, color: P.textDim, lineHeight: 1.75, marginBottom: 36, maxWidth: 400 }}>
              Your projects are already running. Apex Developments gives you the clarity to lead them — from the executive suite to the field.
            </p>
            <button onClick={onEnter} style={btnPrimary}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 36px ${P.brassGlow}` }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 6px 24px ${P.brassGlow}` }}>
              Open Dashboard →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { n: '< 5 min', label: 'To full setup' },
              { n: '24/7', label: 'Live data sync' },
              { n: '99.9%', label: 'Uptime SLA' },
              { n: '0', label: 'Learning curve' },
            ].map(s => (
              <div key={s.label} style={{ background: P.nav, border: `1px solid ${P.border}`, borderRadius: 10, padding: '24px' }}>
                <div style={{ fontFamily: 'Roboto Slab, serif', fontSize: 28, fontWeight: 700, color: P.brass, marginBottom: 6 }}>{s.n}</div>
                <div style={{ fontFamily: 'Work Sans', fontSize: 12, color: P.textDim }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: P.bg, borderTop: `1px solid ${P.border}`, padding: '28px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 3, height: 18, background: P.brass, borderRadius: 99 }} />
            <span style={{ fontFamily: 'Roboto Slab, serif', fontSize: 14, fontWeight: 700, color: P.text }}>
              Apex <span style={{ color: P.brass }}>Developments</span>
            </span>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: P.textMuted, letterSpacing: '0.1em' }}>
            © 2026 SITECOMMAND · ALL RIGHTS RESERVED
          </span>
        </div>
      </footer>
    </div>
  )
}
