import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

type Tab = 'login' | 'register' | 'guest'

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

  if (user) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(8,8,20,0.65)', backdropFilter: 'blur(6px)' }}>
        <div className={`w-full transition-all duration-500 ${animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
          style={{
            maxWidth: 380,
            background: 'linear-gradient(135deg,rgba(30,30,60,0.85),rgba(20,20,40,0.9))',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 24, padding: 'clamp(24px,5vw,40px) clamp(20px,5vw,36px)',
            boxShadow: '0 32px 80px rgba(0,0,40,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset'
          }}>
          <div className="text-center mb-8">
            <div style={{ fontSize: 52, marginBottom: 8 }}>🏢</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 4 }}>DLavie OS</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Welcome back, <strong style={{ color: '#a78bfa' }}>{user.username}</strong></p>
            {user.isDev && (
              <span style={{ marginTop: 8, display: 'inline-block', padding: '2px 10px', background: 'rgba(234,179,8,0.2)', color: '#fbbf24', borderRadius: 20, fontSize: 11, border: '1px solid rgba(234,179,8,0.3)' }}>
                ⚡ Developer Access
              </span>
            )}
          </div>
          <button onClick={() => setGameState('playing')}
            style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, marginBottom: 10, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
            🚀 Enter Office
          </button>
          <button onClick={() => logout()}
            style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Switch Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ background: 'rgba(4,4,15,0.6)', backdropFilter: 'blur(5px)' }}>

      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 'min(600px,90vw)', height: 300, background: 'radial-gradient(ellipse,rgba(99,102,241,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div className={`w-full transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{
          maxWidth: 400,
          background: 'linear-gradient(135deg,rgba(20,20,50,0.92),rgba(10,10,30,0.95))',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24, padding: 'clamp(24px,5vw,40px) clamp(18px,5vw,36px)',
          boxShadow: '0 40px 100px rgba(0,0,20,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset'
        }}>

        <div className="text-center mb-6">
          <div style={{ fontSize: 'clamp(40px,8vw,54px)', marginBottom: 10, filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.6))' }}>🏢</div>
          <h1 style={{ fontSize: 'clamp(20px,5vw,28px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', margin: '0 0 4px' }}>DLavie OS</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>AI Agent Office Simulation</p>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {['🤖 AI Agents','🌆 Open World','🔐 Auth'].map(t => (
              <span key={t} style={{ padding: '2px 8px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, fontSize: 10, color: '#a5b4fc' }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['login','register','guest'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setLocalErr(''); clearAuthError() }}
              style={{ flex: 1, padding: '10px 0', fontSize: 12, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', border: 'none', background: tab === t ? 'rgba(99,102,241,0.35)' : 'transparent', color: tab === t ? '#c7d2fe' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
              {t === 'login' ? '🔑 Login' : t === 'register' ? '📝 Register' : '👥 Guest'}
            </button>
          ))}
        </div>

        {tab !== 'guest' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={username} onChange={e => { setUsername(e.target.value); setLocalErr('') }}
              placeholder="Username"
              style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setLocalErr('') }}
              placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleAuth()}
              style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            {localErr && <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', margin: 0 }}>⚠ {localErr}</p>}
            <button onClick={handleAuth}
              style={{ padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', marginTop: 4, boxShadow: '0 8px 24px rgba(124,58,237,0.45)' }}>
              {tab === 'login' ? '🔑 Login' : '📝 Create Account'}
            </button>
            {tab === 'login' && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', margin: 0 }}>
                Tip: Register dengan username <strong style={{ color: '#fbbf24' }}>Drmacze</strong> untuk developer access
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              Masuk sebagai tamu tanpa akun.<br />Beberapa fitur eksklusif terbatas.
            </p>
            <button onClick={() => setGameState('playing')}
              style={{ padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', boxShadow: '0 8px 24px rgba(5,150,105,0.4)' }}>
              👥 Masuk sebagai Tamu
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center' }}>
        DLavie OS v0.9 — AI Agent Office © 2026
      </p>
    </div>
  )
}
