"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function SearchContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q")
  const [results, setResults] = useState<
    Array<{ title: string; ncode: string; author: string; excerpt: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (q) {
      setLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch")
          return res.json()
        })
        .then((data) => {
          setResults(data.novels || [])
          setError("")
        })
        .catch((err) => {
          setError("検索に失敗しました。")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [q])

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background/95 py-4 backdrop-blur">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="truncate text-xl font-bold">「{q}」の検索結果</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : results.length === 0 ? (
        <p>結果が見つかりませんでした。</p>
      ) : (
        <div className="divide-y border-y">
          {results.map((novel) => (
            <Link
              key={novel.ncode}
              href={`/novel/${novel.ncode}`}
              className="group flex min-w-0 items-center justify-between px-1 py-5 transition-colors active:bg-muted"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="truncate text-lg leading-tight font-bold group-hover:text-primary">
                  {novel.title}
                </h2>
                <p className="truncate text-sm font-medium text-muted-foreground">
                  {novel.author}
                </p>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
                  {novel.excerpt}
                </p>
              </div>
              <ChevronRight className="ml-4 h-5 w-5 shrink-0 text-muted-foreground/50" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
