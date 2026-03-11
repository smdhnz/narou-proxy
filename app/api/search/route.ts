import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")

  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  try {
    const url = `https://yomou.syosetu.com/search.php?word=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`)
    }
    const html = await res.text()
    const $ = cheerio.load(html)

    const novels: Array<{
      title: string
      ncode: string
      author: string
      excerpt: string
    }> = []

    $(".searchkekka_box").each((_, el) => {
      const titleEl = $(el).find(".tl")
      const title = titleEl.text().trim()
      const href = titleEl.attr("href") || ""
      const ncodeMatch = href.match(/ncode\.syosetu\.com\/(n[a-z0-9]+)\/?/)
      const ncode = ncodeMatch ? ncodeMatch[1] : null

      // 作者の取得を調整。`.novel_h` の直後、または `作者：` のリンク先
      const author =
        $(el).find('a[href*="mypage.syosetu.com"]').first().text().trim() ||
        $(el)
          .text()
          .match(/作者：(.*?)／/)?.[1]
          ?.trim() ||
        "不明"

      const excerpt = $(el).find(".ex").text().trim()

      if (ncode) {
        novels.push({ title, ncode, author, excerpt })
      }
    })

    return NextResponse.json({ novels })
  } catch (error: any) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch search results" },
      { status: 500 }
    )
  }
}
