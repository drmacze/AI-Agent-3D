import { useFloor } from '@/context/FloorContext'
import { useGameStore } from '@/store/gameStore'

interface Props {
  nearNpcName: string | null
  onInteract: () => void
}

export function InGameHUD({ nearNpcName, onInteract }: Props) {
  const { currentFloor } = useFloor()
  const { user, gameState } = useGameStore()
  if (gameState !== 'playing') return null

  return (
    <>
      {/* Crosshair — hidden on small touch screens */}
      <div className="hidden sm:block" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: 24, height: 24 }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.8)', transform: 'translateX(-50%)', borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.8)', transform: 'translateY(-50%)', borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', transform: 'translate(-50%,-50%)' }} />
        </div>
      </div>

      {/* Interact prompt */}
      {nearNpcName && (
        <div
          style={{
            position: 'absolute', bottom: '35%', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
            background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600,
            backdropFilter: 'blur(6px)', cursor: 'pointer', whiteSpace: 'nowrap',
            maxWidth: 'calc(100vw - 32px)',
          }}
          onClick={onInteract}
        >
          <span style={{ color: '#a5b4fc' }}>🤖 {nearNpcName}</span>
          <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 8 }}>
            — Tekan <kbd style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 6px', fontFamily: 'monospace' }}>E</kbd> untuk chat
          </span>
          <span className="sm:hidden" style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 8 }}>— Tap untuk chat</span>
        </div>
      )}

      {/* Top bar — floor + user */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '5px 14px',
          border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>FLOOR</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#c7d2fe' }}>{currentFloor}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>|</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{user?.username ?? 'Guest'}</span>
          {user?.isDev && <span style={{ fontSize: 10, color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '1px 6px', borderRadius: 8 }}>DEV</span>}
        </div>
      </div>

      {/* Controls hint — desktop only */}
      <div className="hidden sm:flex" style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 20, pointerEvents: 'none', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
        {[
          ['WASD', 'Gerak'],
          ['Mouse', 'Lihat'],
          ['Space', 'Lompat'],
          ['Shift', 'Sprint'],
          ['Esc', 'Unlock'],
        ].map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.4 }}>
            <span style={{ fontSize: 11, color: '#fff' }}>{label}</span>
            <kbd style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.15)' }}>{key}</kbd>
          </div>
        ))}
      </div>

      {/* Click-to-lock hint — desktop only */}
      <div className="hidden sm:block" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, whiteSpace: 'nowrap' }}>
        Klik di layar untuk aktifkan mouse look
      </div>

      {/* Mobile touch hint */}
      <div className="sm:hidden" style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, whiteSpace: 'nowrap' }}>
        Gunakan joystick untuk bergerak
      </div>
    </>
  )
}
