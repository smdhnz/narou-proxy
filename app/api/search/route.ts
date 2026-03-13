import { NextResponse } from "next/server"
import { getSearchResults } from "@/lib/narou"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")

  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  try {
    const data = await getSearchResults(q)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch search results" },
      { status: 500 }
    )
  }
}
