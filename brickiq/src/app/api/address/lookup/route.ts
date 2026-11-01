import { NextResponse, type NextRequest } from "next/server";
import { lookupAddress } from "@/lib/data/pdok";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!/^[a-z]{3}-[0-9a-f]{20,64}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
  }
  try {
    const result = await lookupAddress(id);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=86400" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Could not retrieve this address from PDOK.", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
