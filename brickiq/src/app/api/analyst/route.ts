import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { ANALYST_SYSTEM_PROMPT } from "@/lib/analyst";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.BRICKIQ_AI_MODEL || "claude-opus-5-5";

function liveAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Tells the client whether the live AI analyst is configured. Never exposes the key. */
export async function GET() {
  return NextResponse.json({ live: liveAvailable(), model: liveAvailable() ? MODEL : null });
}

interface Body {
  context: unknown;
  messages: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: NextRequest) {
  if (!liveAvailable()) {
    return NextResponse.json(
      { error: "Live AI is not configured on this deployment.", code: "not_configured" },
      { status: 503 },
    );
  }
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Last message must be from the user" }, { status: 400 });
  }
  const contextJson = JSON.stringify(body.context ?? {}).slice(0, 60000);

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const s = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 4000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          system: [
            { type: "text", text: ANALYST_SYSTEM_PROMPT },
            { type: "text", text: `Report context (JSON):\n${contextJson}` },
          ],
          messages,
        } as Parameters<typeof client.beta.messages.stream>[0]);
        s.on("text", (t) => controller.enqueue(encoder.encode(t)));
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n_The analyst declined to answer this question._"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n_(answer truncated)_"));
        }
        controller.close();
      } catch (e) {
        let msg = "The AI service failed to respond.";
        if (e instanceof Anthropic.RateLimitError) msg = "The AI service is busy (rate limited). Try again shortly.";
        else if (e instanceof Anthropic.AuthenticationError) msg = "The AI service credentials are invalid.";
        else if (e instanceof Anthropic.APIError) msg = `The AI service returned an error (${e.status ?? "network"}).`;
        controller.enqueue(encoder.encode(`\n\n[[BRICKIQ_ERROR]]${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-BrickIQ-Model": MODEL,
    },
  });
}
