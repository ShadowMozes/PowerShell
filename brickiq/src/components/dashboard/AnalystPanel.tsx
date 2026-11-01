"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Cpu, Loader2, Sparkles, User } from "lucide-react";
import type { Analysis } from "@/lib/engine/analysis";
import type { BidInputs, BidOutcome } from "@/lib/engine/bidding";
import { SUGGESTED_QUESTIONS, buildAnalystContext, deterministicAnswer } from "@/lib/analyst";
import { Card, Disclaimer, cn } from "../ui";

type Mode = "live" | "rules";
interface Msg {
  role: "user" | "assistant";
  content: string;
  mode?: Mode;
  note?: string;
}

/** Minimal, safe markdown: **bold**, _italic_ / *italic*, "- " bullets, paragraphs. */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*)/g).map((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (/^_[^_]+_$/.test(part) || /^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
      return <Fragment key={i}>{part}</Fragment>;
    });
  return (
    <div className="prose-analyst">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        const bullets = lines.filter((l) => /^\s*[-•*]\s+/.test(l));
        if (bullets.length && bullets.length === lines.filter((l) => l.trim()).length) {
          return (
            <ul key={i}>
              {bullets.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•*]\s+/, ""))}</li>)}
            </ul>
          );
        }
        return (
          <div key={i}>
            {lines.map((l, j) =>
              /^\s*[-•*]\s+/.test(l) ? (
                <ul key={j}><li>{inline(l.replace(/^\s*[-•*]\s+/, ""))}</li></ul>
              ) : l.trim() ? (
                <p key={j}>{inline(l.replace(/^#+\s*/, ""))}</p>
              ) : null,
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AnalystPanel({ analysis, bid }: { analysis: Analysis; bid: { inputs: BidInputs; outcome: BidOutcome } }) {
  const [status, setStatus] = useState<{ live: boolean; model: string | null } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/analyst")
      .then((r) => r.json())
      .then((d: { live: boolean; model: string | null }) => setStatus(d))
      .catch(() => setStatus({ live: false, model: null }));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    const history: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(history);
    setBusy(true);

    const fallback = (note?: string) => {
      setMessages((m) => {
        const copy = m.filter((x, i) => !(i === m.length - 1 && x.role === "assistant" && !x.content));
        return [...copy, { role: "assistant", content: deterministicAnswer(question, analysis, bid), mode: "rules", note }];
      });
    };

    if (!status?.live) {
      // Rule-based analyst — computed instantly from the report, no artificial delay.
      fallback();
      setBusy(false);
      return;
    }

    try {
      setMessages((m) => [...m, { role: "assistant", content: "", mode: "live" }]);
      const res = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: buildAnalystContext(analysis, bid),
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        const errIdx = acc.indexOf("[[BRICKIQ_ERROR]]");
        const visible = errIdx >= 0 ? acc.slice(0, errIdx) : acc;
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: visible, mode: "live" }]);
      }
      const errIdx = acc.indexOf("[[BRICKIQ_ERROR]]");
      if (errIdx >= 0) {
        const msg = acc.slice(errIdx + 17).trim();
        if (!acc.slice(0, errIdx).trim()) fallback(`${msg} Showing the rule-based answer instead.`);
        else setMessages((m) => [...m.slice(0, -1), { ...m[m.length - 1], note: msg }]);
      }
    } catch {
      fallback("Live AI could not be reached. Showing the rule-based answer instead.");
    } finally {
      setBusy(false);
    }
  };

  const live = status?.live;

  return (
    <div className="space-y-4">
      <Card className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line p-4 sm:p-5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-ivory"><Bot className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="font-display truncate text-lg font-medium leading-tight">Property Analyst</div>
            <div className="truncate text-xs text-muted">Grounded in this report{bid ? " & your scenario" : ""}</div>
          </div>
          {status === null ? (
            <span className="text-xs text-muted">…</span>
          ) : live ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-[11px] font-semibold text-emerald">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-2" /> Live AI · Claude
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-semibold text-gold">
              <Cpu className="h-3 w-3" /> Rule-based
            </span>
          )}
        </div>

        {status && !live && (
          <div className="border-b border-line bg-gold-soft/40 px-4 py-2.5 text-xs leading-relaxed text-ink-2 sm:px-5">
            Live AI isn&apos;t configured on this deployment, so answers come from BrickIQ&apos;s deterministic rule-based analyst — computed from the same report data, not generated by a language model.
          </div>
        )}

        <div className="min-h-[340px] space-y-4 p-4 sm:p-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="py-6 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-emerald-2" />
              <p className="font-display mt-3 text-xl font-medium">What would you like to understand?</p>
              <p className="mt-1 text-sm text-muted">Ask about the valuation, score, risks or your offer.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", m.role === "user" ? "bg-slate-soft text-slate" : "bg-ink text-ivory")}>
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn("max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed", m.role === "user" ? "rounded-tr-md bg-ink text-ivory" : "rounded-tl-md border border-line bg-ivory/60 text-ink-2")}>
                {m.role === "assistant" && !m.content ? (
                  <span className="flex items-center gap-2 text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</span>
                ) : m.role === "assistant" ? (
                  <RichText text={m.content} />
                ) : (
                  m.content
                )}
                {m.role === "assistant" && m.content && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line/70 pt-2 text-[10.5px] text-muted">
                    {m.mode === "live" ? "Generated live by Claude · verify important facts" : "Rule-based answer · not generated by AI"}
                    {m.note && <span className="text-gold">· {m.note}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-line p-3 sm:p-4">
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => ask(q)}
                className="shrink-0 rounded-full border border-line bg-paper px-3.5 py-2 text-xs font-medium text-ink-2 transition hover:border-emerald-2/40 hover:text-emerald disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-end gap-2 rounded-3xl border border-line bg-paper p-1.5 pl-4 focus-within:border-emerald-2/50"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              placeholder="Ask about this property…"
              aria-label="Ask the property analyst"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-[16px] outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send question"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald text-ivory transition hover:bg-emerald-2 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </Card>
      <Disclaimer>
        The analyst explains BrickIQ&apos;s model outputs. It does not provide financial, legal or tax advice, certified valuations, or offer-acceptance predictions.
      </Disclaimer>
    </div>
  );
}
