"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useReadingHistory } from "@/hooks/useReadingHistory"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, ChevronRight, Trash2 } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const [query, setQuery] = useState("")
  const router = useRouter()
  const { history, isLoaded, removeHistory } = useReadingHistory()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 overflow-hidden p-4">
      <header className="flex items-center justify-between py-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="h-6 w-6" />
          なろうプロキシ
        </h1>
      </header>

      <section>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="小説を名前で検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-base"
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            検索
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-xl font-bold">読みかけの小説</h2>
        {!isLoaded ? (
          <p className="text-muted-foreground">読み込み中...</p>
        ) : history.length === 0 ? (
          <p className="text-muted-foreground">履歴はありません。</p>
        ) : (
          <div className="divide-y border-y">
            {history.map((item) => (
              <div
                key={item.ncode}
                className="group flex items-center transition-colors active:bg-muted"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 shrink-0 text-muted-foreground/40 hover:text-destructive active:text-destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (confirm("履歴から削除しますか？")) {
                      removeHistory(item.ncode)
                    }
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                <Link
                  href={`/novel/${item.ncode}/${item.lastReadChapter}`}
                  className="flex min-w-0 flex-1 items-center justify-between py-4 pr-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="truncate text-lg leading-tight font-bold group-hover:text-primary">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate pr-4">
                        {item.chapterTitle || `${item.lastReadChapter}部分`}
                      </span>
                      <span className="shrink-0">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="ml-4 h-5 w-5 shrink-0 text-muted-foreground/30" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
