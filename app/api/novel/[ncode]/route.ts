import { NextResponse } from "next/server"
import { getNovelInfo } from "@/lib/narou"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ncode: string }> }
) {
  const ncode = (await params).ncode
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("p") || "1"

  try {
    const data = await getNovelInfo(ncode, page)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Novel info API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch novel info" },
      { status: 500 }
    )
  }
}
