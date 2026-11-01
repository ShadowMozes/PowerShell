import { NextResponse, type NextRequest } from "next/server";
import { suggestAddresses } from "@/lib/data/pdok";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ suggestions: [] });
  if (q.length > 120) return NextResponse.json({ error: "Query too long" }, { status: 400 });
  try {
    const suggestions = await suggestAddresses(q);
    return NextResponse.json(
      { suggestions, source: "PDOK Locatieserver" },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "The PDOK address service is unreachable right now.", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
