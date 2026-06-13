import { useState, useCallback, useRef } from 'react'

interface JoyState { x: number; y: number }

interface Props {
  joystickMove: React.MutableRefObject<JoyState>
  joystickLook: React.MutableRefObject<JoyState>
  jumpTrigger: React.MutableRefObject<boolean>
}

function Knob({ dx, dy }: { dx: number; dy: number }) {
  return (
    <div style={{ position: 'relative', width: 96, height: 96 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{
        position: 'absolute', width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.6)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        left: '50%', top: '50%',
        transform: `translate(calc(-50% + ${dx * 28}px), calc(-50% + ${dy * 28}px))`,
        transition: 'none',
      }} />
    </div>
  )
}

interface TouchData { id: number; startX: number; startY: number; side: 'left' | 'right' }

export function TouchControls({ joystickMove, joystickLook, jumpTrigger }: Props) {
  const [leftDelta, setLeftDelta] = useState<JoyState>({ x: 0, y: 0 })
  const [rightDelta, setRightDelta] = useState<JoyState>({ x: 0, y: 0 })
  const touchData = useRef<TouchData[]>([])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    Array.from(e.changedTouches).forEach(t => {
      const side = t.clientX < window.innerWidth / 2 ? 'left' : 'right'
      touchData.current.push({ id: t.identifier, startX: t.clientX, startY: t.clientY, side })
    })
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    Array.from(e.changedTouches).forEach(touch => {
      const td = touchData.current.find(t => t.id === touch.identifier)
      if (!td) return
      const dx = Math.max(-1, Math.min(1, (touch.clientX - td.startX) / 52))
      const dy = Math.max(-1, Math.min(1, (touch.clientY - td.startY) / 52))
      if (td.side === 'left') {
        joystickMove.current = { x: dx, y: dy }
        setLeftDelta({ x: dx, y: dy })
      } else {
        joystickLook.current = { x: dx, y: dy }
        setRightDelta({ x: dx, y: dy })
      }
    })
  }, [joystickMove, joystickLook])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    Array.from(e.changedTouches).forEach(touch => {
      const td = touchData.current.find(t => t.id === touch.identifier)
      if (!td) return
      touchData.current = touchData.current.filter(t => t.id !== touch.identifier)
      if (td.side === 'left') { joystickMove.current = { x: 0, y: 0 }; setLeftDelta({ x: 0, y: 0 }) }
      else { joystickLook.current = { x: 0, y: 0 }; setRightDelta({ x: 0, y: 0 }) }
    })
  }, [joystickMove, joystickLook])

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto', touchAction: 'none' }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {/* Left stick */}
      <div style={{ position: 'absolute', bottom: 64, left: 48, pointerEvents: 'none' }}>
        <Knob dx={leftDelta.x} dy={leftDelta.y} />
        <div style={{ marginTop: 4, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>MOVE</div>
      </div>

      {/* Right stick */}
      <div style={{ position: 'absolute', bottom: 64, right: 48, pointerEvents: 'none' }}>
        <Knob dx={rightDelta.x} dy={rightDelta.y} />
        <div style={{ marginTop: 4, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>LOOK</div>
      </div>

      {/* Jump button */}
      <button
        style={{
          position: 'absolute', bottom: 72, right: 200, width: 56, height: 56,
          borderRadius: '50%', border: '2px solid rgba(99,102,241,0.6)',
          background: 'rgba(99,102,241,0.25)', color: 'white', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
        }}
        onTouchStart={e => { e.preventDefault(); e.stopPropagation(); jumpTrigger.current = true }}>
        ⬆
      </button>

      {/* Sprint button */}
      <button
        style={{
          position: 'absolute', bottom: 72, left: 200, width: 56, height: 56,
          borderRadius: '50%', border: '2px solid rgba(239,68,68,0.6)',
          background: 'rgba(239,68,68,0.2)', color: 'white', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onTouchStart={e => e.preventDefault()}>
        🏃
      </button>
    </div>
  )
}
