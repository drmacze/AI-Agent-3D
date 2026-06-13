import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { audioManager } from '@/lib/audioManager'

const WALK_SPEED = 5
const RUN_SPEED = 10
const JUMP_VEL = 7
const GRAVITY = -22
const PLAYER_HEIGHT = 1.72
const BOUNDS = { minX: -13, maxX: 12.8, minZ: -9, maxZ: 9.2 }

const BLOCKED: [number, number, number][] = [
  [-5, -3, 1.0], [-1, -3, 1.0], [3, -3, 1.0],
  [-5, 2, 1.0], [-1, 2, 1.0], [3, 2, 1.0],
  [7, 1, 1.6],
  [-10.5, -8, 1.1],
  [-4, -9.5, 1.0], [9.5, -8, 1.0],
]

export interface NpcPositionEntry {
  id: string
  name: string
  x: number
  z: number
  agentData?: unknown
}

interface Props {
  joystickMove: React.MutableRefObject<{ x: number; y: number }>
  joystickLook: React.MutableRefObject<{ x: number; y: number }>
  jumpTrigger: React.MutableRefObject<boolean>
  onNearNpc?: (name: string | null, agentData?: unknown) => void
  npcPositions?: NpcPositionEntry[]
}

export function FirstPersonController({ joystickMove, joystickLook, jumpTrigger, onNearNpc, npcPositions }: Props) {
  const { camera, gl } = useThree()
  const { setNpcReaction } = useGameStore()
  const keys = useRef(new Set<string>())
  const vel = useRef(new THREE.Vector3())
  const grounded = useRef(true)
  const yaw = useRef(Math.PI)
  const pitch = useRef(-0.12)
  const pos = useRef(new THREE.Vector3(0, PLAYER_HEIGHT, 7))
  const locked = useRef(false)
  const nearNpc = useRef<string | null>(null)
  const footstepTimer = useRef(0)
  const wasGrounded = useRef(true)
  const wasJumping = useRef(false)

  useEffect(() => {
    camera.position.copy(pos.current)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current
  }, [camera])

  useEffect(() => {
    const canvas = gl.domElement
    const onClick = () => { if (!locked.current) canvas.requestPointerLock() }
    const onMove = (e: MouseEvent) => {
      if (!locked.current) return
      yaw.current -= e.movementX * 0.002
      pitch.current = Math.max(-1.05, Math.min(0.75, pitch.current - e.movementY * 0.002))
    }
    const onLockChange = () => { locked.current = document.pointerLockElement === canvas }
    canvas.addEventListener('click', onClick)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('pointerlockchange', onLockChange)
    return () => {
      canvas.removeEventListener('click', onClick)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('pointerlockchange', onLockChange)
    }
  }, [gl])

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keys.current.add(e.code)
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  function isBlocked(x: number, z: number) {
    if (x < BOUNDS.minX || x > BOUNDS.maxX || z < BOUNDS.minZ || z > BOUNDS.maxZ) return true
    for (const [bx, bz, r] of BLOCKED) {
      const dx = x - bx, dz = z - bz
      if (dx * dx + dz * dz < r * r) return true
    }
    return false
  }

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05)

    // Touch look
    if (joystickLook.current.x !== 0 || joystickLook.current.y !== 0) {
      yaw.current -= joystickLook.current.x * 0.045
      pitch.current = Math.max(-1.05, Math.min(0.75, pitch.current - joystickLook.current.y * 0.035))
    }

    const sprint = keys.current.has('ShiftLeft') || keys.current.has('ShiftRight')
    const speed = sprint ? RUN_SPEED : WALK_SPEED
    const fwd = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    const rgt = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current))
    const move = new THREE.Vector3()

    if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) move.addScaledVector(fwd, 1)
    if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) move.addScaledVector(fwd, -1)
    if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) move.addScaledVector(rgt, -1)
    if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) move.addScaledVector(rgt, 1)

    if (Math.abs(joystickMove.current.x) > 0.12) move.addScaledVector(rgt, joystickMove.current.x)
    if (Math.abs(joystickMove.current.y) > 0.12) move.addScaledVector(fwd, -joystickMove.current.y)

    if ((keys.current.has('Space') || jumpTrigger.current) && grounded.current) {
      vel.current.y = JUMP_VEL
      grounded.current = false
      jumpTrigger.current = false
      wasJumping.current = true
      audioManager.playJump()
    }
    if (jumpTrigger.current) jumpTrigger.current = false

    if (!grounded.current) vel.current.y += GRAVITY * d

    if (move.lengthSq() > 0) move.normalize()
    const nx = pos.current.x + move.x * speed * d
    const nz = pos.current.z + move.z * speed * d
    if (!isBlocked(nx, pos.current.z)) pos.current.x = nx
    if (!isBlocked(pos.current.x, nz)) pos.current.z = nz
    pos.current.y += vel.current.y * d

    const justLanded = !wasGrounded.current && pos.current.y <= PLAYER_HEIGHT + 0.01
    if (pos.current.y <= PLAYER_HEIGHT) {
      pos.current.y = PLAYER_HEIGHT; vel.current.y = 0; grounded.current = true
    }

    // Jump sound
    if (wasJumping.current && !grounded.current) {
      wasJumping.current = false
    }

    // Land sound
    if (justLanded) {
      audioManager.playLand()
    }
    wasGrounded.current = grounded.current

    // Footstep sounds when moving on ground
    const isMoving = move.lengthSq() > 0
    if (isMoving && grounded.current) {
      const interval = sprint ? 0.27 : 0.42
      footstepTimer.current += d
      if (footstepTimer.current >= interval) {
        footstepTimer.current = 0
        audioManager.playFootstep(sprint)
      }
    } else {
      footstepTimer.current = 0
    }

    camera.position.copy(pos.current)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current

    // NPC proximity check
    if (npcPositions && onNearNpc) {
      let found: string | null = null
      let foundData: unknown = undefined
      for (const npc of npcPositions) {
        const dx = pos.current.x - npc.x, dz = pos.current.z - npc.z
        const dist2 = dx * dx + dz * dz
        if (dist2 < 9) {
          found = npc.name
          foundData = npc.agentData
          if (dist2 < 1.5) {
            setNpcReaction(npc.id, { kind: 'bump', ts: Date.now() })
            setTimeout(() => setNpcReaction(npc.id, null), 2000)
          }
          break
        }
      }
      if (found !== nearNpc.current) {
        nearNpc.current = found
        onNearNpc(found, foundData)
      }
    }
  })

  return null
}
