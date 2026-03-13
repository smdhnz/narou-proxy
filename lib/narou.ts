import { unstable_cache } from "next/cache"
import * as cheerio from "cheerio"

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

/**
 * 検索結果の取得とパース
 */
async function fetchSearchResultsInternal(q: string) {
  const url = `https://yomou.syosetu.com/search.php?word=${encodeURIComponent(q)}`
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "force-cache",
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

  return { novels }
}

/**
 * 小説基本情報の取得とパース
 */
async function fetchNovelInfoInternal(ncode: string, page: string = "1") {
  const url =
    page === "1"
      ? `https://ncode.syosetu.com/${ncode}/`
      : `https://ncode.syosetu.com/${ncode}/?p=${page}`

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "force-cache",
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
  $(".index_box .subtitle a, a.p-eplist__subtitle, .p-eplist__subtitle a").each(
    (_, el) => {
      const chapterTitle = $(el).text().trim()
      const href = $(el).attr("href") || ""
      const chapterMatch = href.match(new RegExp(`${ncode}\/(\\d+)`))
      const chapter = chapterMatch ? chapterMatch[1] : null

      if (chapter) {
        chapters.push({ chapter, title: chapterTitle })
      }
    }
  )

  return {
    title,
    author,
    synopsis,
    totalPages,
    currentPage: parseInt(page),
    chapters,
  }
}

/**
 * 小説本文の取得とパース
 */
async function fetchChapterContentInternal(ncode: string, chapter: string) {
  const res = await fetch(`https://ncode.syosetu.com/${ncode}/${chapter}/`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "force-cache",
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

  const lines: string[] = []
  const contentArea = $("#novel_honbun, .p-novel__text, .js-novel-text")

  contentArea.find("p, div").each((_, el) => {
    const line = $(el).html() || ""
    if (line) lines.push(line)
  })

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
      } else if (text.includes("次") || $(el).hasClass("c-pager__item--next")) {
        nextChapterId = id
      }
    }
  })

  return {
    title,
    lines,
    prevChapter: prevChapterId,
    nextChapter: nextChapterId,
  }
}

// ----------------------------------------------------------------------------
// キャッシュ層の定義
// ----------------------------------------------------------------------------

export const getSearchResults = (q: string) =>
  unstable_cache((query: string) => fetchSearchResultsInternal(query), [q], {
    revalidate: 3600, // 1時間
    tags: ["search", q],
  })(q)

export const getNovelInfo = (ncode: string, page: string = "1") =>
  unstable_cache(
    (n: string, p: string) => fetchNovelInfoInternal(n, p),
    [`novel-${ncode}-${page}`],
    {
      revalidate: 86400, // 24時間
      tags: ["novel", ncode, page],
    }
  )(ncode, page)

export const getChapterContent = (ncode: string, chapter: string) =>
  unstable_cache(
    (n: string, c: string) => fetchChapterContentInternal(n, c),
    [`chapter-${ncode}-${chapter}`],
    {
      revalidate: 604800, // 1週間
      tags: ["chapter", ncode, chapter],
    }
  )(ncode, chapter)
