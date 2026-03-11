import { useState, useEffect } from "react"

export type HistoryItem = {
  ncode: string
  title: string
  author: string
  lastReadChapter: string
  chapterTitle: string
  timestamp: number
  scrollPosition?: number
}

export function useReadingHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("reading_history")
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse reading history", e)
      }
    }
    setIsLoaded(true)
  }, [])

  const saveHistory = (item: Omit<HistoryItem, "timestamp">) => {
    setHistory((prev) => {
      const existing = prev.find((h) => h.ncode === item.ncode)
      // 同じチャプターを読み直している場合は、既存のスクロール位置を維持する
      const scrollPosition =
        existing?.lastReadChapter === item.lastReadChapter
          ? existing.scrollPosition
          : undefined

      const filtered = prev.filter((h) => h.ncode !== item.ncode)
      const updated = [
        { ...item, scrollPosition, timestamp: Date.now() },
        ...filtered,
      ].slice(0, 50) // 直近50件まで
      localStorage.setItem("reading_history", JSON.stringify(updated))
      return updated
    })
  }


  const removeHistory = (ncode: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.ncode !== ncode)
      localStorage.setItem("reading_history", JSON.stringify(updated))
      return updated
    })
  }

  const updateScrollPosition = (ncode: string, scrollPosition: number) => {
    setHistory((prev) => {
      const item = prev.find((h) => h.ncode === ncode)
      if (item) {
        const updatedItem = { ...item, scrollPosition, timestamp: Date.now() }
        const filtered = prev.filter((h) => h.ncode !== ncode)
        const updated = [updatedItem, ...filtered]
        localStorage.setItem("reading_history", JSON.stringify(updated))
        return updated
      }
      return prev
    })
  }

  return { history, isLoaded, saveHistory, removeHistory, updateScrollPosition }
}
