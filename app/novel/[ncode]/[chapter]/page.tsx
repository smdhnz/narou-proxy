"use client"

import { useEffect, useState, use, useRef, useLayoutEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Menu, Minus, Plus, Settings2, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useReadingHistory } from "@/hooks/useReadingHistory"
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogTrigger as DialogTrigger,
} from "@/components/ui/responsive-dialog"

export default function ChapterPage({
  params,
}: {
  params: Promise<{ ncode: string; chapter: string }>
}) {
  const { ncode, chapter } = use(params)
  type ChapterData = {
    title: string
    lines: string[]
    prevChapter: string | null
    nextChapter: string | null
  }
  type NovelInfo = {
    title: string
    author: string
    synopsis: string
    chapters: Array<{ chapter: string; title: string }>
  }
  const [data, setData] = useState<ChapterData | null>(null)
  const [novelInfo, setNovelInfo] = useState<NovelInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [fontSize, setFontSize] = useState(20)
  const [fontFamily, setFontFamily] = useState<"sans" | "serif">("serif")
  const {
    history,
    saveHistory,
    updateScrollPosition,
    isLoaded: historyLoaded,
  } = useReadingHistory()
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasRestored = useRef(false)

  // ページ切り替え時にリセット
  useEffect(() => {
    hasRestored.current = false
  }, [ncode, chapter])

  // 設定の読み込み
  useEffect(() => {
    const savedSize = localStorage.getItem("novel_font_size")
    if (savedSize) setFontSize(parseInt(savedSize))

    const savedFont = localStorage.getItem("novel_font_family")
    if (savedFont === "sans" || savedFont === "serif") setFontFamily(savedFont)
  }, [])

  // フォントサイズの保存
  const adjustFontSize = (delta: number) => {
    const newSize = Math.min(Math.max(fontSize + delta, 14), 40)
    setFontSize(newSize)
    localStorage.setItem("novel_font_size", newSize.toString())
  }

  // フォントファミリーの保存
  const toggleFontFamily = (font: "sans" | "serif") => {
    setFontFamily(font)
    localStorage.setItem("novel_font_family", font)
  }

  // データ取得
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/novel/${ncode}/${chapter}`).then((res) => res.json()),
      fetch(`/api/novel/${ncode}`).then((res) => res.json()),
    ])
      .then(([chapterData, infoData]) => {
        setData(chapterData)
        setNovelInfo(infoData)
        setLoading(false)
        saveHistory({
          ncode,
          title: infoData.title || "",
          author: infoData.author || "",
          lastReadChapter: chapter,
          chapterTitle: chapterData.title || "",
        })
      })
      .catch(() => {
        setError("データの取得に失敗しました。")
        setLoading(false)
      })
  }, [ncode, chapter])

  // スクロール位置の復元
  useLayoutEffect(() => {
    if (
      scrollRef.current &&
      data &&
      historyLoaded &&
      !hasRestored.current &&
      !loading
    ) {
      const item = history.find(
        (h) => h.ncode === ncode && h.lastReadChapter === chapter
      )
      if (item?.scrollPosition !== undefined) {
        // レイアウト完了を待つために一瞬遅らせる
        const el = scrollRef.current
        const pos = item.scrollPosition
        requestAnimationFrame(() => {
          if (el) el.scrollLeft = pos
        })
      } else {
        scrollRef.current.scrollLeft = 0
      }
      hasRestored.current = true
    }
  }, [data, historyLoaded, ncode, chapter, history, loading])

  // スクロール位置の保存
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let timeoutId: NodeJS.Timeout | null = null
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updateScrollPosition(ncode, el.scrollLeft)
      }, 500)
    }

    el.addEventListener("scroll", handleScroll)
    return () => {
      el.removeEventListener("scroll", handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [ncode, updateScrollPosition])

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-lg">
        読み込み中...
      </div>
    )
  if (error || !data)
    return (
      <div className="p-8 text-center text-destructive">
        {error || "エラーが発生しました。"}
      </div>
    )

  return (
    <div
      vaul-drawer-wrapper=""
      className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground"
    >
      {/* 簡素なヘッダー */}
      <header className="z-30 flex h-14 w-full shrink-0 items-center justify-between border-b bg-background/95 px-4 shadow-sm backdrop-blur">
        {/* 左: 戻る */}
        <div className="flex w-12 items-center">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/novel/${ncode}`} title="目次に戻る">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* 中: 前後ボタン (縦書きを考慮し、左に「次」、右に「前」) */}
        <div className="flex items-center gap-2">
          {data.nextChapter ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-sm font-medium"
            >
              <Link href={`/novel/${ncode}/${data.nextChapter}`}>次へ</Link>
            </Button>
          ) : (
            <span className="w-12" />
          )}
          <div className="mx-1 h-4 w-px bg-border" />
          {data.prevChapter ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-sm font-medium"
            >
              <Link href={`/novel/${ncode}/${data.prevChapter}`}>前へ</Link>
            </Button>
          ) : (
            <span className="w-12" />
          )}
        </div>

        {/* 右: メニュー */}
        <div className="flex w-12 items-center justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full rounded-none border-none font-sans sm:max-w-[400px] sm:rounded-xl sm:border">
              <DialogHeader>
                <DialogTitle className="mb-4 text-left">設定</DialogTitle>
                <DialogDescription className="sr-only">
                  文字サイズの設定を変更します。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 px-4 py-4 pb-12 sm:pb-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Settings2 className="h-4 w-4" /> 文字サイズ
                    </span>
                    <span className="rounded bg-muted px-2 py-0.5 text-sm font-bold">
                      {fontSize}px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="h-12 flex-1"
                      onClick={() => adjustFontSize(-2)}
                      autoFocus
                    >
                      <Minus className="mr-2 h-4 w-4" /> 小さく
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 flex-1"
                      onClick={() => adjustFontSize(2)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> 大きく
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Type className="h-4 w-4" /> フォント
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={fontFamily === "sans" ? "default" : "outline"}
                      className="h-12 flex-1"
                      onClick={() => toggleFontFamily("sans")}
                    >
                      ゴシック
                    </Button>
                    <Button
                      variant={fontFamily === "serif" ? "default" : "outline"}
                      className="h-12 flex-1"
                      onClick={() => toggleFontFamily("serif")}
                    >
                      明朝
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 本文エリア：完全にスクロールのみに任せる */}
      <main
        ref={scrollRef}
        className={cn(
          "h-full w-full overflow-x-auto overflow-y-hidden px-8 py-10 md:px-24 md:py-20",
          fontFamily === "serif" ? "font-serif" : "font-sans"
        )}
        style={{
          writingMode: "vertical-rl",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <article
          className="h-full min-w-[100.1%] leading-[1.8] tracking-[0.05em]"
          style={{ fontSize: `${fontSize}px` }}
        >
          {/* タイトル表示 */}
          <div className="mb-20 ml-20 flex flex-col gap-6">
            <p className="text-sm font-medium text-muted-foreground/80">
              {novelInfo?.title}
            </p>
            <h1 className="text-3xl leading-tight font-bold tracking-tighter">
              {data.title}
            </h1>
          </div>

          {data.lines.map((line: string, i: number) => (
            <p
              key={i}
              className="mb-2 min-h-[1em] text-justify whitespace-normal"
              dangerouslySetInnerHTML={{ __html: line }}
            />
          ))}
          {/* 読み終わりの余白：スクロールを完結させるため */}
          <div className="h-full w-32 shrink-0" />
        </article>
      </main>
    </div>
  )
}
