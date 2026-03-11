"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function NovelPage({
  params,
}: {
  params: Promise<{ ncode: string }>
}) {
  const { ncode } = use(params)
  type NovelData = {
    title: string
    author: string
    synopsis: string
    totalPages: number
    currentPage: number
    chapters: Array<{ chapter: string; title: string }>
  }
  const [novel, setNovel] = useState<NovelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isSynopsisOpen, setIsSynopsisOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/novel/${ncode}?p=${currentPage}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => {
        setNovel(data)
        setError("")
      })
      .catch((err) => {
        setError("小説の取得に失敗しました。")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [ncode, currentPage])

  if (loading && !novel) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    )
  }

  if (error || !novel) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <p className="text-destructive">
          {error || "小説が見つかりませんでした。"}
        </p>
        <Button variant="link" asChild className="p-0">
          <Link href="/">トップへ戻る</Link>
        </Button>
      </div>
    )
  }

  const totalPages = novel.totalPages

  const Pager = ({ showScroll = false }: { showScroll?: boolean }) => (
    <div className="flex items-center justify-center gap-2 py-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setCurrentPage(1)
          if (showScroll) window.scrollTo({ top: 0, behavior: "smooth" })
        }}
        disabled={currentPage === 1 || loading}
        title="最初へ"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={() => {
          setCurrentPage((p) => Math.max(1, p - 1))
          if (showScroll) window.scrollTo({ top: 0, behavior: "smooth" })
        }}
        disabled={currentPage === 1 || loading}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> 前へ
      </Button>

      <span className="min-w-[60px] text-center text-xs font-medium">
        {currentPage} / {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={() => {
          setCurrentPage((p) => Math.min(totalPages, p + 1))
          if (showScroll) window.scrollTo({ top: 0, behavior: "smooth" })
        }}
        disabled={currentPage === totalPages || loading}
      >
        次へ <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setCurrentPage(totalPages)
          if (showScroll) window.scrollTo({ top: 0, behavior: "smooth" })
        }}
        disabled={currentPage === totalPages || loading}
        title="最後へ"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-20">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background/95 py-4 backdrop-blur">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="font-bold">戻る</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl leading-tight font-bold">{novel.title}</h1>
        <p className="text-muted-foreground">{novel.author}</p>
      </div>

      <Collapsible
        open={isSynopsisOpen}
        onOpenChange={setIsSynopsisOpen}
        className="space-y-2"
      >
        <div className="flex items-center justify-between border-b pb-1">
          <h2 className="text-sm font-semibold text-muted-foreground">
            あらすじ
          </h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              {isSynopsisOpen ? (
                <>
                  <span>閉じる</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>開く</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="rounded-md bg-muted/50 p-4 text-sm leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: novel.synopsis }} />
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-8 flex items-center justify-between border-b pb-2">
        <h2 className="text-xl font-bold">目次</h2>
        <span className="text-sm text-muted-foreground">
          全 {totalPages} ページ
        </span>
      </div>

      {totalPages > 1 && <Pager />}

      <div
        className={`divide-y border-y ${loading ? "pointer-events-none opacity-50" : ""}`}
      >
        {novel.chapters.map((chapter) => (
          <Link
            key={chapter.chapter}
            href={`/novel/${ncode}/${chapter.chapter}`}
            className="flex min-w-0 items-center justify-between px-2 py-4 transition-colors active:bg-muted"
          >
            <span className="truncate pr-2 text-sm leading-snug font-medium">
              {chapter.title}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 border-t py-6">
          <Pager showScroll={true} />
        </div>
      )}
    </div>
  )
}
