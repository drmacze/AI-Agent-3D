import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Building2, LogIn, UserPlus, Users, ArrowRight, Zap, AlertCircle } from 'lucide-react'

type Tab = 'login' | 'register' | 'guest'

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontSize: 13.5,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export function LobbyScreen() {
  const { user, login, register, logout, setGameState, authError, clearAuthError } = useGameStore()
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [localErr, setLocalErr] = useState('')
  const [animate, setAnimate] = useState(false)

  useEffect(() => { setTimeout(() => setAnimate(true), 80) }, [])

  function handleAuth() {
    clearAuthError(); setLocalErr('')
    let ok = false
    if (tab === 'login') ok = login(username, password)
    else ok = register(username, password)
    const err = useGameStore.getState().authError
    if (ok) { setGameState('playing') } else setLocalErr(err)
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(10,10,14,0.97)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 'clamp(24px,5vw,36px) clamp(20px,5vw,32px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
  }

  if (user) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(14px)' }}>
        <div
          className={`w-full transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ maxWidth: 340, ...cardStyle }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'rgba(99,102,241,0.1)', borderRadius: 14, marginBottom: 14, border: '1px solid rgba(99,102,241,0.18)' }}>
              <Building2 size={24} color="#818cf8" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.4px', margin: '0 0 5px' }}>DLavie OS</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
              Welcome back, <strong style={{ color: '#a5b4fc', fontWeight: 600 }}>{user.username}</strong>
            </p>
            {user.isDev && (
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: 'rgba(234,179,8,0.08)', color: '#f59e0b', borderRadius: 20, fontSize: 11, border: '1px solid rgba(234,179,8,0.18)' }}>
                <Zap size={10} /> Developer
              </div>
            )}
          </div>
          <button
            onClick={() => setGameState('playing')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, marginBottom: 10, background: '#4f46e5', color: '#fff' }}
          >
            Enter Office <ArrowRight size={15} />
          </button>
          <button
            onClick={() => logout()}
            style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}
          >
            Switch Account
          </button>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'login',    label: 'Sign In',  icon: <LogIn size={12} /> },
    { id: 'register', label: 'Register', icon: <UserPlus size={12} /> },
    { id: 'guest',    label: 'Guest',    icon: <Users size={12} /> },
  ]

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
    >
      <div
        className={`w-full transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ maxWidth: 360, ...cardStyle }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, background: 'rgba(99,102,241,0.09)', borderRadius: 14, marginBottom: 14, border: '1px solid rgba(99,102,241,0.16)' }}>
            <Building2 size={22} color="#818cf8" />
          </div>
          <h1 style={{ fontSize: 'clamp(18px,4.5vw,23px)', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.4px', margin: '0 0 5px' }}>DLavie OS</h1>
          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12.5, margin: 0 }}>AI Agent Office Simulation</p>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 22, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setLocalErr(''); clearAuthError() }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 0', fontSize: 12, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', border: 'none', borderRadius: 7, background: tab === t.id ? 'rgba(99,102,241,0.22)' : 'transparent', color: tab === t.id ? '#c7d2fe' : 'rgba(255,255,255,0.32)', transition: 'all 0.15s' }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab !== 'guest' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setLocalErr('') }}
              placeholder="Username"
              style={inputStyle}
            />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setLocalErr('') }}
              placeholder="Password"
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              style={inputStyle}
            />
            {localErr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: 12 }}>
                <AlertCircle size={13} /> {localErr}
              </div>
            )}
            <button
              onClick={handleAuth}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: '#4f46e5', color: '#fff', marginTop: 2 }}
            >
              {tab === 'login'
                ? <><LogIn size={15} /> Sign In</>
                : <><UserPlus size={15} /> Create Account</>}
            </button>
            {tab === 'login' && (
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', margin: '2px 0 0' }}>
                Username <strong style={{ color: 'rgba(251,191,36,0.6)' }}>Drmacze</strong> for developer access
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, textAlign: 'center', margin: 0, lineHeight: 1.55 }}>
              Continue without an account.<br />Some exclusive features will be limited.
            </p>
            <button
              onClick={() => setGameState('playing')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}
            >
              <Users size={15} /> Continue as Guest
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.14)', fontSize: 11, textAlign: 'center' }}>
        DLavie OS v0.9 — AI Agent Office © 2026
      </p>
    </div>
  )
}
