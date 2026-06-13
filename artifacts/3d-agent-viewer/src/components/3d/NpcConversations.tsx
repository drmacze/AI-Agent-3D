import { useEffect, useRef } from 'react'
import { useFloor } from '@/context/FloorContext'
import { useGameStore, type Lang } from '@/store/gameStore'

const SNIPPETS: Record<string, [string, string][]> = {
  id: [
    ["Hei, sudah review PR-nya?", "Belum sempat, lagi debug nih!"],
    ["Meeting tadi gimana?", "Lumayan, ada progress baru."],
    ["Kopi yuk!", "Iya, sebentar ya."],
    ["Codebase-nya makin besar.", "Iya, perlu refactor nih."],
    ["Model AI kita naik 3%!", "Wah bagus banget!"],
    ["Deploy malam ini aman?", "Harusnya sih, sudah di-test."],
    ["Ada bug di modul payment.", "Serius? Gue cek sekarang."],
    ["Deadline besok!", "Santai, hampir selesai kok."],
    ["Server sempet down tadi.", "Waduh, sudah recover?"],
    ["Test-nya passing semua!", "Akhirnya! Siap deploy."],
  ],
  en: [
    ["Did you review the PR?", "Not yet, still debugging!"],
    ["How was the meeting?", "Good, solid progress."],
    ["Coffee run?", "Absolutely, one sec."],
    ["The codebase keeps growing.", "We need a refactor soon."],
    ["AI model up 3%!", "Great news!"],
    ["Night deploy okay?", "Should be, tested it."],
    ["Found a bug in payments.", "Seriously? Let me check."],
    ["Deadline's tomorrow!", "Almost done, don't worry."],
    ["Server was down briefly.", "All good now?"],
    ["All tests passing!", "Finally! Ready to ship."],
  ],
  ja: [
    ["PRをレビューした?", "まだ、デバッグ中なんだ！"],
    ["ミーティングどうだった?", "順調だよ、進捗あった。"],
    ["コーヒー行く?", "もちろん、すぐ行く。"],
    ["コードベースが大きくなってる", "リファクタが必要だね"],
    ["AIモデルが3%向上！", "すごい！"],
    ["夜のデプロイは大丈夫?", "テスト済みだから大丈夫"],
    ["支払いにバグ見つけた", "本当に？見てみる"],
    ["明日が締め切りだ！", "ほぼ終わってる、安心して"],
    ["サーバーが少し落ちた", "もう復旧した?"],
    ["テスト全部通過！", "ついに！デプロイ準備OK"],
  ],
  zh: [
    ["你审查PR了吗?", "还没，正在调试！"],
    ["会议怎么样?", "不错，有新进展。"],
    ["去喝咖啡?", "好啊，稍等一下。"],
    ["代码库越来越大了", "需要重构了"],
    ["AI模型提升了3%！", "太好了！"],
    ["夜间部署没问题?", "应该没问题，已测试"],
    ["支付模块有个bug", "真的？我去看看"],
    ["明天就是截止日期！", "快完成了，别担心"],
    ["服务器短暂宕机", "恢复了吗?"],
    ["所有测试通过！", "终于！准备部署"],
  ],
}

export function NpcConversations() {
  const { getNpcsByFloor, currentFloor } = useFloor()
  const { setNpcBubble, lang } = useGameStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const snippets = SNIPPETS[lang] || SNIPPETS.id

    function fire() {
      const npcs = getNpcsByFloor(currentFloor)
      if (npcs.length < 2) { schedule(); return }

      // Pick two random distinct NPCs
      const shuffled = [...npcs].sort(() => Math.random() - 0.5)
      const speaker = shuffled[0]
      const listener = shuffled[1]
      const [line1, line2] = snippets[Math.floor(Math.random() * snippets.length)]
      const ts = Date.now()

      // Speaker talks
      setNpcBubble(speaker.id, { speakerId: speaker.id, text: line1, lang: lang as Lang, ts })

      // Listener replies after 3.5 sec
      setTimeout(() => {
        setNpcBubble(speaker.id, null)
        setNpcBubble(listener.id, { speakerId: listener.id, text: line2, lang: lang as Lang, ts: Date.now() })

        // Clear listener bubble after 3.5 sec
        setTimeout(() => setNpcBubble(listener.id, null), 3800)
      }, 3800)

      schedule()
    }

    function schedule() {
      timerRef.current = setTimeout(fire, 10000 + Math.random() * 8000)
    }

    // Initial delay
    timerRef.current = setTimeout(fire, 2000 + Math.random() * 3000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentFloor, lang, getNpcsByFloor, setNpcBubble])

  return null
}
