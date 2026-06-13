---
name: DLavie OS FPS Upgrade
description: Key decisions and gotchas from the FPS controller + lobby system upgrade.
---

## Architecture
- `gameStore` (Zustand) manages: `gameState` ('lobby'|'playing'), `user` (localStorage), `npcBubbles`, `npcReactions`, `lang`, `devRoomOpen`.
- `FloorScene` reads `gameState` and renders either `<LobbyCamera>` or `<FirstPersonController>` — never both.
- `TouchControls` is rendered **outside** the Canvas div (overlaid via `position:relative` wrapper).

## R3F Camera Typing Gotcha
`useThree().camera` returns `THREE.Camera` which lacks `.fov`. Must cast:
```typescript
const pc = camera as unknown as THREE.PerspectiveCamera
pc.fov = 55; pc.updateProjectionMatrix()
```

## NPC Proximity + agentData Flow
- `npcPositions` array in FloorScene includes `agentData` (full agent or NpcAgent object).
- FirstPersonController calls `onNearNpc(name, agentData)` when player enters 3-unit radius.
- Home.tsx stores `nearNpcData` in state; E key calls `setChatTarget(nearNpcData)` to open ChatOverlay.
- Bump reaction: within 1.5-unit radius → `setNpcReaction(npc.id, {kind:'bump'})` → cleared after 2s.

## NpcConversations
Renders inside Canvas as a null-returning React component (no R3F hooks needed). Fires every 10–18 sec, picks 2 random NPCs, shows 2 sequential speech bubbles (3.8s each). Supports 4 languages: id, en, ja, zh.

**Why:** Putting it inside Canvas means it's co-located with the 3D scene and automatically has access to FloorContext without extra provider nesting.

## Developer Room
- Door at x=12.6, z=-7.5. Clicking when `isDev=false` triggers shake animation.
- `user.isDev` is set when username === 'Drmacze' (case-sensitive) at registration.
- Door animates open (rotation.y = -π/2) when `devRoomOpen && isDev`.
