import { useState, useCallback, useRef } from 'react'

interface JoyState { x: number; y: number }

interface Props {
  joystickMove: React.MutableRefObject<JoyState>
  joystickLook: React.MutableRefObject<JoyState>
  jumpTrigger: React.MutableRefObject<boolean>
}

function MovementKnob({ dx, dy }: { dx: number; dy: number }) {
  return (
    <div style={{ position: 'relative', width: 112, height: 112 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.18)',
        background: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(6px)',
      }} />
      <div style={{
        position: 'absolute', width: 46, height: 46, borderRadius: '50%',
        background: 'rgba(255,255,255,0.45)',
        border: '2px solid rgba(255,255,255,0.75)',
        boxShadow: '0 3px 18px rgba(0,0,0,0.55)',
        left: '50%', top: '50%',
        transform: `translate(calc(-50% + ${dx * 34}px), calc(-50% + ${dy * 34}px))`,
      }} />
    </div>
  )
}

interface TouchEntry {
  id: number
  startX: number
  startY: number
  prevX: number
  prevY: number
  side: 'left' | 'right'
}

const LOOK_SENS = 0.0016

export function TouchControls({ joystickMove, joystickLook }: Props) {
  const [leftDelta, setLeftDelta] = useState<JoyState>({ x: 0, y: 0 })
  const touchData = useRef<TouchEntry[]>([])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const threshold = window.innerWidth * 0.44
    Array.from(e.changedTouches).forEach(t => {
      const side = t.clientX < threshold ? 'left' : 'right'
      touchData.current.push({
        id: t.identifier,
        startX: t.clientX, startY: t.clientY,
        prevX: t.clientX, prevY: t.clientY,
        side,
      })
    })
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    Array.from(e.changedTouches).forEach(touch => {
      const td = touchData.current.find(t => t.id === touch.identifier)
      if (!td) return

      if (td.side === 'left') {
        const dx = Math.max(-1, Math.min(1, (touch.clientX - td.startX) / 54))
        const dy = Math.max(-1, Math.min(1, (touch.clientY - td.startY) / 54))
        joystickMove.current = { x: dx, y: dy }
        setLeftDelta({ x: dx, y: dy })
      } else {
        joystickLook.current.x += (touch.clientX - td.prevX) * LOOK_SENS
        joystickLook.current.y += (touch.clientY - td.prevY) * LOOK_SENS
        td.prevX = touch.clientX
        td.prevY = touch.clientY
      }
    })
  }, [joystickMove, joystickLook])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    Array.from(e.changedTouches).forEach(touch => {
      const td = touchData.current.find(t => t.id === touch.identifier)
      if (!td) return
      touchData.current = touchData.current.filter(t => t.id !== touch.identifier)
      if (td.side === 'left') {
        joystickMove.current = { x: 0, y: 0 }
        setLeftDelta({ x: 0, y: 0 })
      }
    })
  }, [joystickMove])

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'auto', touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Left movement joystick */}
      <div style={{ position: 'absolute', bottom: 68, left: 36, pointerEvents: 'none' }}>
        <MovementKnob dx={leftDelta.x} dy={leftDelta.y} />
        <div style={{
          marginTop: 7, textAlign: 'center',
          color: 'rgba(255,255,255,0.22)', fontSize: 9,
          letterSpacing: 1.5, fontWeight: 600,
        }}>MOVE</div>
      </div>

      {/* Swipe hint on right — subtle, no knob */}
      <div style={{
        position: 'absolute', bottom: 76, right: 36, pointerEvents: 'none',
        color: 'rgba(255,255,255,0.13)', fontSize: 10, textAlign: 'center', letterSpacing: 0.5,
      }}>
        <div style={{ fontSize: 18, marginBottom: 3, opacity: 0.6 }}>⟳</div>
        <div style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 600 }}>SWIPE TO LOOK</div>
      </div>
    </div>
  )
}
