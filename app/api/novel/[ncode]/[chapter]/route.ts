import { NextResponse } from "next/server"
import { getChapterContent } from "@/lib/narou"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ncode: string; chapter: string }> }
) {
  const { ncode, chapter } = await params

  try {
    const data = await getChapterContent(ncode, chapter)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Chapter fetch API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch chapter" },
      { status: 500 }
    )
  }
}
