"use client"

import { useState } from 'react'

const A = {
  bg: '#0F1115',
  nav: '#16181D',
  panel: '#2A2D34',
  border: '#3F434C',
  borderFocus: '#C9A15A',
  text: '#E4E5E7',
  textDim: 'rgba(228,229,231,0.48)',
  textMuted: 'rgba(228,229,231,0.28)',
  brass: '#C9A15A',
  brassDim: 'rgba(201,161,90,0.12)',
  brassGlow: 'rgba(201,161,90,0.2)',
  error: '#D4772E',
}

const INPUT_BASE: React.CSSProperties = {
  width: '100%',
  background: '#16181D',
  border: `1px solid ${A.border}`,
  borderRadius: 6,
  padding: '13px 16px',
  fontFamily: 'Work Sans, sans-serif',
  fontSize: 14,
  color: A.text,
  outline: 'none',
  transition: 'border-color 0.18s ease',
  boxSizing: 'border-box',
}

function Input({
  label, type = 'text', placeholder, value, onChange, hint,
}: {
  label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; hint?: string;
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: A.textDim, marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...INPUT_BASE,
          borderColor: focused ? A.brass : A.border,
          boxShadow: focused ? `0 0 0 3px ${A.brassGlow}` : 'none',
        }}
      />
      {hint && <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: A.textMuted, marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: A.border }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: A.textMuted, letterSpacing: '0.1em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: A.border }} />
    </div>
  )
}

function SignIn({ onSwitch, onEnter }: { onSwitch: () => void; onEnter: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); onEnter() }, 900)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Input label="Email address" type="email" placeholder="you@sitecommand.io" value={email} onChange={setEmail} />
      <Input label="Password" type="password" placeholder="••••••••••" value={password} onChange={setPassword} />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: A.brass, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: 7, border: 'none',
          background: loading ? A.brassDim : A.brass,
          color: loading ? A.textDim : '#16181D',
          fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
          letterSpacing: '0.02em',
          transition: 'all 0.18s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
        {loading
          ? <><Spinner /> Authenticating…</>
          : 'Sign In to Apex Developments'
        }
      </button>

      <Divider label="or continue with" />

      <SSORow />

      <p style={{ textAlign: 'center', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: A.textDim, marginTop: 4 }}>
        No account?{' '}
        <button type="button" onClick={onSwitch}
          style={{ color: A.brass, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
          Create one →
        </button>
      </p>
    </form>
  )
}

function SignUp({ onSwitch, onEnter }: { onSwitch: () => void; onEnter: () => void }) {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); onEnter() }, 1000)
  }

  const ROLES = ['Project Manager', 'Site Foreman', 'Executive / Owner', 'Engineer', 'Estimator', 'Other']

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Input label="Full name" placeholder="D. Marchetti" value={name} onChange={setName} />
        <Input label="Company" placeholder="Westfield Group" value={company} onChange={setCompany} />
      </div>

      <Input label="Work email" type="email" placeholder="you@company.com" value={email} onChange={setEmail} />
      <Input label="Password" type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword}
        hint="Use a mix of letters, numbers & symbols" />

      <div>
        <label style={{ display: 'block', fontFamily: 'Work Sans, sans-serif', fontSize: 12, fontWeight: 600, color: A.textDim, marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Your role
        </label>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...INPUT_BASE,
            borderColor: focused ? A.brass : A.border,
            boxShadow: focused ? `0 0 0 3px ${A.brassGlow}` : 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23${A.textDim.replace('#', '')}' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            cursor: 'pointer',
          }}>
          <option value="" disabled style={{ background: A.panel }}>Select your role…</option>
          {ROLES.map(r => <option key={r} value={r} style={{ background: A.panel }}>{r}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 2 }}>
        <input type="checkbox" id="terms" style={{ marginTop: 2, accentColor: A.brass, flexShrink: 0, cursor: 'pointer' }} />
        <label htmlFor="terms" style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: A.textDim, lineHeight: 1.6, cursor: 'pointer' }}>
          I agree to the <span style={{ color: A.brass }}>Terms of Service</span> and <span style={{ color: A.brass }}>Privacy Policy</span>
        </label>
      </div>

      <button type="submit" disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: 7, border: 'none',
          background: loading ? A.brassDim : A.brass,
          color: loading ? A.textDim : '#16181D',
          fontFamily: 'Work Sans, sans-serif', fontSize: 14, fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
          letterSpacing: '0.02em',
          transition: 'all 0.18s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 4,
        }}>
        {loading ? <><Spinner /> Creating account…</> : 'Create Account'}
      </button>

      <p style={{ textAlign: 'center', fontFamily: 'Work Sans, sans-serif', fontSize: 13, color: A.textDim }}>
        Already have access?{' '}
        <button type="button" onClick={onSwitch}
          style={{ color: A.brass, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
          Sign in →
        </button>
      </p>
    </form>
  )
}

function SSORow() {
  const btn = (label: string, icon: string) => (
    <button type="button" key={label}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '11px 0', borderRadius: 6,
        background: 'transparent', border: `1px solid ${A.border}`,
        color: A.textDim, fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: 500,
        cursor: 'pointer', transition: 'border-color 0.15s ease, color 0.15s ease',
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = A.brass; e.currentTarget.style.color = A.text }}
      onMouseOut={e => { e.currentTarget.style.borderColor = A.border; e.currentTarget.style.color = A.textDim }}>
      <span style={{ fontSize: 15 }}>{icon}</span> {label}
    </button>
  )
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {btn('Microsoft', '⊞')}
      {btn('Google', '⊕')}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 18" />
    </svg>
  )
}

const METRICS = [
  { value: '$56.4M', label: 'Portfolio value' },
  { value: '214', label: 'Crew deployed' },
  { value: '4', label: 'Live projects' },
]

export default function AuthPage({ onEnter }: { onEnter: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: A.bg, fontFamily: 'Work Sans, sans-serif' }}>

      {/* LEFT PANEL — visual / brand */}
      <div style={{
        flex: '0 0 46%', position: 'relative', overflow: 'hidden',
        background: A.nav,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(https://images.unsplash.com/photo-1784791483114-ccd9af1caadc?w=900&h=1200&fit=crop&auto=format)`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.13,
        }} />

        {/* Blueprint grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(201,161,90,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,161,90,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />

        {/* Gradient fade */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, rgba(15,17,21,0.0) 0%, rgba(22,24,29,0.7) 60%, ${A.bg} 100%)`,
        }} />

        {/* Brass top rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${A.brass}, transparent)` }} />

        {/* Content */}
        <div style={{ position: 'relative', padding: '44px 48px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div className="flex items-center gap-2" style={{ marginBottom: 'auto' }}>
            <div style={{ width: 3, height: 22, background: A.brass, borderRadius: 99 }} />
            <span style={{ fontFamily: 'Roboto Slab, serif', fontSize: 16, fontWeight: 700, color: A.text, letterSpacing: '-0.01em' }}>
              Apex <span style={{ color: A.brass }}>Developments</span>
            </span>
          </div>

          {/* Center hero text */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 24 }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              color: A.brass, letterSpacing: '0.22em',
              marginBottom: 22, textTransform: 'uppercase',
            }}>
              Construction Operations Platform
            </div>

            <h1 style={{
              fontFamily: 'Roboto Slab, serif', fontSize: 44, fontWeight: 700,
              color: A.text, lineHeight: 1.1, letterSpacing: '-0.025em',
              marginBottom: 20,
            }}>
              Command your<br />
              projects.<br />
              <span style={{ color: A.brass }}>Deliver</span> with precision.
            </h1>

            <p style={{ fontSize: 15, color: A.textDim, lineHeight: 1.75, maxWidth: 360, marginBottom: 48 }}>
              Every budget tracked. Every crew coordinated. Every deadline met. One platform, built for the demands of modern construction.
            </p>

            {/* Metrics */}
            <div style={{ display: 'flex', gap: 0, borderTop: `1px solid ${A.border}`, paddingTop: 32 }}>
              {METRICS.map((m, i) => (
                <div key={m.label} style={{
                  flex: 1, paddingRight: 24,
                  borderRight: i < METRICS.length - 1 ? `1px solid ${A.border}` : 'none',
                  marginRight: i < METRICS.length - 1 ? 24 : 0,
                }}>
                  <div style={{ fontFamily: 'Roboto Slab, serif', fontSize: 28, fontWeight: 700, color: A.brass, lineHeight: 1, marginBottom: 5 }}>{m.value}</div>
                  <div style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: A.textMuted }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: A.textMuted, letterSpacing: '0.1em' }}>
            © 2026 SITECOMMAND · SECURE ACCESS
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Mode toggle pills */}
          <div style={{
            display: 'inline-flex', background: A.nav, border: `1px solid ${A.border}`,
            borderRadius: 8, padding: 4, marginBottom: 36,
          }}>
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  fontFamily: 'Work Sans, sans-serif', fontSize: 13, fontWeight: mode === m ? 600 : 400,
                  padding: '8px 22px', borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: mode === m ? A.brass : 'transparent',
                  color: mode === m ? '#16181D' : A.textDim,
                  transition: 'all 0.18s ease',
                }}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: 'Roboto Slab, serif', fontSize: 26, fontWeight: 700,
              color: A.text, letterSpacing: '-0.02em', marginBottom: 8,
            }}>
              {mode === 'signin' ? 'Welcome back.' : 'Join Apex Developments.'}
            </h2>
            <p style={{ fontSize: 14, color: A.textDim, lineHeight: 1.6 }}>
              {mode === 'signin'
                ? 'Sign in to access your project dashboard and field operations.'
                : 'Create your account and bring your team under one command.'}
            </p>
          </div>

          {/* Form */}
          <div style={{ transition: 'opacity 0.2s ease' }}>
            {mode === 'signin'
              ? <SignIn onSwitch={() => setMode('signup')} onEnter={onEnter} />
              : <SignUp onSwitch={() => setMode('signin')} onEnter={onEnter} />
            }
          </div>

          {/* Security note */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 }}>
            <span style={{ color: A.textMuted, fontSize: 11 }}>🔒</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: A.textMuted, letterSpacing: '0.1em' }}>
              256-BIT SSL · SOC 2 TYPE II CERTIFIED
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}
