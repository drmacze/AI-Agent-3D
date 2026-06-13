import { create } from 'zustand'

export type GameState = 'lobby' | 'playing'
export type Lang = 'id' | 'en' | 'ja' | 'zh'

export interface NpcBubble {
  speakerId: string
  text: string
  lang: Lang
  ts: number
}

export interface NpcReaction {
  kind: 'bump' | 'wave' | 'angry' | 'surprised'
  ts: number
}

export interface GameUser {
  username: string
  isDev: boolean
}

function readUsers(): Record<string, { pw: string; isDev: boolean }> {
  try { return JSON.parse(localStorage.getItem('__dlv_users') || '{}') } catch { return {} }
}
function writeUsers(u: Record<string, { pw: string; isDev: boolean }>) {
  localStorage.setItem('__dlv_users', JSON.stringify(u))
}
function readMe(): GameUser | null {
  try { return JSON.parse(localStorage.getItem('__dlv_me') || 'null') } catch { return null }
}

interface GameStore {
  gameState: GameState
  setGameState(s: GameState): void

  user: GameUser | null
  authError: string
  login(u: string, pw: string): boolean
  register(u: string, pw: string): boolean
  logout(): void
  clearAuthError(): void

  npcBubbles: Record<string, NpcBubble>
  setNpcBubble(id: string, b: NpcBubble | null): void

  npcReactions: Record<string, NpcReaction>
  setNpcReaction(id: string, r: NpcReaction | null): void

  lang: Lang
  setLang(l: Lang): void

  devRoomOpen: boolean
  setDevRoomOpen(v: boolean): void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'lobby',
  setGameState: (gameState) => set({ gameState }),

  user: readMe(),
  authError: '',
  login(username, pw) {
    const users = readUsers()
    if (!users[username]) { set({ authError: 'User tidak ditemukan' }); return false }
    if (users[username].pw !== pw) { set({ authError: 'Password salah' }); return false }
    const user: GameUser = { username, isDev: users[username].isDev }
    localStorage.setItem('__dlv_me', JSON.stringify(user))
    set({ user, authError: '' })
    return true
  },
  register(username, pw) {
    const users = readUsers()
    if (users[username]) { set({ authError: 'Username sudah digunakan' }); return false }
    if (username.length < 3) { set({ authError: 'Username min 3 karakter' }); return false }
    if (pw.length < 4) { set({ authError: 'Password min 4 karakter' }); return false }
    users[username] = { pw, isDev: username === 'Drmacze' }
    writeUsers(users)
    const user: GameUser = { username, isDev: username === 'Drmacze' }
    localStorage.setItem('__dlv_me', JSON.stringify(user))
    set({ user, authError: '' })
    return true
  },
  logout() {
    localStorage.removeItem('__dlv_me')
    set({ user: null, gameState: 'lobby', devRoomOpen: false })
  },
  clearAuthError: () => set({ authError: '' }),

  npcBubbles: {},
  setNpcBubble(id, b) {
    set(s => {
      const next = { ...s.npcBubbles }
      if (b) next[id] = b; else delete next[id]
      return { npcBubbles: next }
    })
  },

  npcReactions: {},
  setNpcReaction(id, r) {
    set(s => {
      const next = { ...s.npcReactions }
      if (r) next[id] = r; else delete next[id]
      return { npcReactions: next }
    })
  },

  lang: (localStorage.getItem('__dlv_lang') as Lang | null) ?? 'id',
  setLang(lang) {
    localStorage.setItem('__dlv_lang', lang)
    set({ lang })
  },

  devRoomOpen: false,
  setDevRoomOpen: (devRoomOpen) => set({ devRoomOpen }),
}))
