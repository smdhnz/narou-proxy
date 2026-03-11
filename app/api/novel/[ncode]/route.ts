import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ncode: string }> }
) {
  const ncode = (await params).ncode
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("p") || "1"

  try {
    const url =
      page === "1"
        ? `https://ncode.syosetu.com/${ncode}/`
        : `https://ncode.syosetu.com/${ncode}/?p=${page}`

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

    const title =
      $(".novel_title").text().trim() || $(".p-novel__title").text().trim()
    const author =
      $(".novel_writername").text().replace("作者：", "").trim() ||
      $(".p-novel__author").text().replace("作者：", "").trim()
    const synopsis = $("#novel_ex").html() || ""

    // ページネーション情報の取得
    const currentPageInt = parseInt(page)
    let totalPages = currentPageInt
    $(".c-pager__item").each((_, el) => {
      const href = $(el).attr("href") || ""
      const match = href.match(/p=(\d+)/)
      if (match) {
        const p = parseInt(match[1])
        if (p > totalPages) totalPages = p
      }
    })

    const chapters: Array<{ chapter: string; title: string }> = []
    $(
      ".index_box .subtitle a, a.p-eplist__subtitle, .p-eplist__subtitle a"
    ).each((_, el) => {
      const chapterTitle = $(el).text().trim()
      const href = $(el).attr("href") || ""
      const chapterMatch = href.match(new RegExp(`${ncode}\/(\\d+)`))
      const chapter = chapterMatch ? chapterMatch[1] : null

      if (chapter) {
        chapters.push({ chapter, title: chapterTitle })
      }
    })

    return NextResponse.json({
      title,
      author,
      synopsis,
      totalPages,
      currentPage: parseInt(page),
      chapters,
    })
  } catch (error: any) {
    console.error("Novel info API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch novel info" },
      { status: 500 }
    )
  }
}
