import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ncode: string; chapter: string }> }
) {
  const { ncode, chapter } = await params

  try {
    const res = await fetch(`https://ncode.syosetu.com/${ncode}/${chapter}/`, {
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
      $(".novel_subtitle").text().trim() ||
      $(".p-novel__subtitle").text().trim() ||
      $(".p-novel__title--rensai").text().trim() ||
      $(".p-novel__title").text().trim()

    // `<p>` elements in the content area
    const lines: string[] = []
    const contentArea = $("#novel_honbun, .p-novel__text, .js-novel-text")

    contentArea.find("p, div").each((_, el) => {
      const line = $(el).html() || ""
      if (line) lines.push(line)
    })

    // If empty, try direct children of contentArea
    if (lines.length === 0) {
      contentArea.contents().each((_, el) => {
        if (el.type === "text") {
          const text = $(el).text().trim()
          if (text) lines.push(text)
        } else if (el.type === "tag" && $(el).is("br")) {
          lines.push("<br />")
        }
      })
    }

    // 前後のエピソード情報の取得
    let prevChapterId: string | null = null
    let nextChapterId: string | null = null

    $(".novel_bn a, .c-pager__item").each((_, el) => {
      const text = $(el).text()
      const href = $(el).attr("href") || ""
      const match = href.match(new RegExp(`${ncode}/(\\d+)/`))
      const id = match ? match[1] : null

      if (id) {
        if (text.includes("前") || $(el).hasClass("c-pager__item--prev")) {
          prevChapterId = id
        } else if (
          text.includes("次") ||
          $(el).hasClass("c-pager__item--next")
        ) {
          nextChapterId = id
        }
      }
    })

    return NextResponse.json({
      title,
      lines,
      prevChapter: prevChapterId,
      nextChapter: nextChapterId,
    })
  } catch (error: any) {
    console.error("Chapter fetch API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch chapter" },
      { status: 500 }
    )
  }
}
