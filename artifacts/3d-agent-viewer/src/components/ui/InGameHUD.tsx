import { useFloor } from '@/context/FloorContext'
import { useGameStore } from '@/store/gameStore'
import { useGameTime } from '@/context/GameTimeContext'

interface Props {
  nearNpcName: string | null
  onInteract: () => void
  nearElevator?: boolean
  onElevatorInteract?: () => void
}

function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  )
}

function ElevatorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <path d="M9 8l3-3 3 3"/><path d="M9 16l3 3 3-3"/>
    </svg>
  )
}

const PHASE_ICONS: Record<string, string> = {
  night:     '🌙',
  dawn:      '🌅',
  morning:   '☀️',
  afternoon: '🌤️',
  evening:   '🌆',
  dusk:      '🌇',
}

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string; sub: string }> = {
  night:     { bg: 'rgba(20,25,60,0.82)',   border: 'rgba(100,130,255,0.22)', text: '#a0b4ff', sub: 'rgba(160,180,255,0.5)' },
  dawn:      { bg: 'rgba(60,25,10,0.82)',   border: 'rgba(255,140,60,0.28)',  text: '#ffb070', sub: 'rgba(255,160,80,0.55)' },
  morning:   { bg: 'rgba(10,30,55,0.78)',   border: 'rgba(180,220,255,0.22)', text: '#c8e8ff', sub: 'rgba(200,230,255,0.5)' },
  afternoon: { bg: 'rgba(8,25,50,0.75)',    border: 'rgba(140,210,255,0.2)',  text: '#b0d8ff', sub: 'rgba(180,220,255,0.5)' },
  evening:   { bg: 'rgba(55,20,5,0.82)',    border: 'rgba(255,120,40,0.28)',  text: '#ffaa60', sub: 'rgba(255,140,70,0.55)' },
  dusk:      { bg: 'rgba(45,15,30,0.82)',   border: 'rgba(200,100,160,0.28)', text: '#e0a0c0', sub: 'rgba(210,130,170,0.5)' },
}

function GameClockHUD() {
  const { timeString, phase } = useGameTime()
  const colors = PHASE_COLORS[phase] ?? PHASE_COLORS.morning
  const icon = PHASE_ICONS[phase] ?? '☀️'

  return (
    <div style={{
      position: 'absolute', top: 12, right: 16, zIndex: 20, pointerEvents: 'none',
    }}>
      <div style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: '4px 11px 4px 9px',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}>
        <span style={{ fontSize: 14, lineHeight: 1, userSelect: 'none' }}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.text, letterSpacing: '-0.3px', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>
            {timeString}
          </span>
          <span style={{ fontSize: 9, color: colors.sub, textTransform: 'capitalize', letterSpacing: 0.8, lineHeight: 1 }}>
            {phase}
          </span>
        </div>
      </div>
    </div>
  )
}

export function InGameHUD({ nearNpcName, onInteract, nearElevator, onElevatorInteract }: Props) {
  const { currentFloor } = useFloor()
  const { user, gameState } = useGameStore()
  if (gameState !== 'playing') return null

  return (
    <>
      {/* Crosshair — hidden on small touch screens */}
      <div className="hidden sm:block" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: 20, height: 20 }}>
          <div style={{ position: 'absolute', left: '50%', top: 2, bottom: 2, width: 1.5, background: 'rgba(255,255,255,0.75)', transform: 'translateX(-50%)', borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: '50%', left: 2, right: 2, height: 1.5, background: 'rgba(255,255,255,0.75)', transform: 'translateY(-50%)', borderRadius: 1 }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', transform: 'translate(-50%,-50%)' }} />
        </div>
      </div>

      {/* NPC interact prompt */}
      {nearNpcName && (
        <div
          style={{
            position: 'absolute', bottom: '35%', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
            background: 'rgba(10,10,16,0.82)', border: '1px solid rgba(165,180,252,0.2)',
            borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 500,
            backdropFilter: 'blur(10px)', cursor: 'pointer', whiteSpace: 'nowrap',
            maxWidth: 'calc(100vw - 32px)', display: 'flex', alignItems: 'center', gap: 8,
          }}
          onClick={onInteract}
        >
          <span style={{ color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 5 }}>
            <BotIcon /> {nearNpcName}
          </span>
          <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            — Press <kbd style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', fontSize: 11, border: '1px solid rgba(255,255,255,0.12)' }}>E</kbd> to chat
          </span>
          <span className="sm:hidden" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>— Tap to chat</span>
        </div>
      )}

      {/* Elevator proximity prompt */}
      {nearElevator && !nearNpcName && (
        <div
          style={{
            position: 'absolute', bottom: '35%', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
            background: 'rgba(10,10,16,0.85)', border: '1px solid rgba(200,160,32,0.22)',
            borderRadius: 10, padding: '8px 18px', color: '#fff', fontSize: 13, fontWeight: 500,
            backdropFilter: 'blur(10px)', cursor: 'pointer', whiteSpace: 'nowrap',
            maxWidth: 'calc(100vw - 32px)', display: 'flex', alignItems: 'center', gap: 8,
          }}
          onClick={onElevatorInteract}
        >
          <span style={{ color: '#fcd34d', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ElevatorIcon /> Elevator
          </span>
          <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            — Press <kbd style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', fontSize: 11, border: '1px solid rgba(255,255,255,0.12)' }}>E</kbd> to call
          </span>
          <span className="sm:hidden" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>— Tap to call</span>
        </div>
      )}

      {/* Top-center bar — floor + user */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(8,8,14,0.65)', borderRadius: 20, padding: '4px 13px',
          border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.2, textTransform: 'uppercase' }}>Floor</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#c7d2fe', letterSpacing: '-0.5px' }}>{currentFloor}</span>
          <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{user?.username ?? 'Guest'}</span>
          {user?.isDev && <span style={{ fontSize: 9.5, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>DEV</span>}
        </div>
      </div>

      {/* Day/Night Clock — top right */}
      <GameClockHUD />

      {/* Controls hint — desktop only */}
      <div className="hidden sm:flex" style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 20, pointerEvents: 'none', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
        {[
          ['WASD', 'Move'],
          ['Mouse', 'Look'],
          ['Space', 'Jump'],
          ['Shift', 'Sprint'],
          ['E', 'Interact'],
          ['Esc', 'Unlock'],
        ].map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.35 }}>
            <span style={{ fontSize: 10.5, color: '#fff' }}>{label}</span>
            <kbd style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 9.5, fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.12)' }}>{key}</kbd>
          </div>
        ))}
      </div>

      {/* Click-to-lock hint */}
      <div className="hidden sm:block" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 11, whiteSpace: 'nowrap' }}>
        Click to enable mouse look
      </div>

      {/* Mobile touch hint */}
      <div className="sm:hidden" style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 11, whiteSpace: 'nowrap' }}>
        Use joystick to move
      </div>
    </>
  )
}
