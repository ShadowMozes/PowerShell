"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, Loader2, MapPin, PencilLine, Search, ShieldCheck } from "lucide-react";
import { Button, Segmented, cn } from "./ui";
import { searchHintFromFundaUrl } from "@/lib/property-codec";

type Mode = "address" | "manual" | "funda";
interface Suggestion {
  id: string;
  label: string;
}

export function SearchPanel({ initialMode = "address" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  return (
    <div className="rounded-[28px] border border-line bg-paper/95 p-2 shadow-lift backdrop-blur">
      <div className="flex items-center justify-between gap-2 p-1.5 pb-2">
        <Segmented
          label="Search method"
          value={mode}
          onChange={setMode}
          className="w-full sm:w-auto"
          options={[
            { value: "address", label: <span className="flex items-center justify-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Address</span> },
            { value: "manual", label: <span className="flex items-center justify-center gap-1.5"><PencilLine className="h-3.5 w-3.5" />Manual</span> },
            { value: "funda", label: <span className="flex items-center justify-center gap-1.5"><Link2 className="h-3.5 w-3.5" />Funda link</span> },
          ]}
        />
      </div>
      {mode === "address" && <AddressSearch />}
      {mode === "manual" && <ManualStart />}
      {mode === "funda" && <FundaStart onSwitch={() => setMode("address")} />}
    </div>
  );
}

export function AddressSearch({ initialQuery = "", autoFocus, referenceUrl }: { initialQuery?: string; autoFocus?: boolean; referenceUrl?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const reqRef = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setItems([]);
      setError(null);
      return;
    }
    const n = ++reqRef.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address/suggest?q=${encodeURIComponent(term)}`);
        const data = (await res.json()) as { suggestions?: Suggestion[]; error?: string };
        if (n !== reqRef.current) return;
        if (!res.ok) throw new Error(data.error || "Address service unavailable");
        setItems(data.suggestions ?? []);
        setError(data.suggestions?.length ? null : "No Dutch address found. Try street + number + city.");
        setOpen(true);
        setActive(-1);
      } catch (e) {
        if (n !== reqRef.current) return;
        setItems([]);
        setError(e instanceof Error ? e.message : "Address service unavailable");
        setOpen(true);
      } finally {
        if (n === reqRef.current) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const choose = (s: Suggestion) => {
    setOpen(false);
    setQ(s.label);
    router.push(`/analyze?id=${encodeURIComponent(s.id)}${referenceUrl ? `&ref=${encodeURIComponent(referenceUrl)}` : ""}`);
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const pick = items[active >= 0 ? active : 0];
          if (pick) choose(pick);
        }}
        className="flex items-center gap-2 rounded-[22px] bg-ivory-2/70 p-1.5 pl-4 ring-1 ring-transparent focus-within:bg-paper focus-within:ring-emerald-2/40"
      >
        <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        <input
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label="Search a Dutch address"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="e.g. Oudegracht 158 Utrecht"
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted/80"
          autoComplete="off"
          enterKeyHint="search"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="Searching" />}
        <Button type="submit" size="md" className="shrink-0" disabled={!items.length} aria-label="Analyse address">
          <span className="hidden sm:inline">Analyse</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      {open && (items.length > 0 || error) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-2xl border border-line bg-paper p-1.5 shadow-lift animate-rise"
        >
          {items.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                i === active ? "bg-ivory-2" : "hover:bg-ivory-2/60",
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-emerald-2" />
              <span className="truncate">{s.label}</span>
            </li>
          ))}
          {error && (
            <li className="px-3 py-2.5 text-sm text-muted">
              {error}{" "}
              <a href="/analyze?mode=manual" className="font-medium text-emerald-2 underline underline-offset-2">
                Enter details manually
              </a>
            </li>
          )}
          <li className="flex items-center gap-1.5 border-t border-line px-3 pt-2 pb-1 text-[10.5px] text-muted">
            <ShieldCheck className="h-3 w-3 text-emerald-2" /> Live results from PDOK Locatieserver (official BAG address register)
          </li>
        </ul>
      )}
    </div>
  );
}

function ManualStart() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3 rounded-[22px] bg-ivory-2/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-2">
        No address needed. Enter size, year, label and asking price to get a full report with every input marked as <em>your input</em>.
      </p>
      <Button onClick={() => router.push("/analyze?mode=manual")} className="shrink-0">
        Enter details <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function FundaStart({ onSwitch }: { onSwitch: () => void }) {
  const [url, setUrl] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const h = searchHintFromFundaUrl(url);
          if (!h) {
            setErr("That doesn't look like a funda.nl listing link.");
            setHint(null);
            return;
          }
          setErr(null);
          setHint(h);
        }}
        className="flex items-center gap-2 rounded-[22px] bg-ivory-2/70 p-1.5 pl-4 focus-within:bg-paper focus-within:ring-1 focus-within:ring-emerald-2/40"
      >
        <Link2 className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        <input
          aria-label="Paste a Funda listing URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.funda.nl/detail/koop/…"
          inputMode="url"
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted/80"
        />
        <Button type="submit" className="shrink-0">Use link</Button>
      </form>
      {err && <p className="px-2 text-sm text-rose">{err}</p>}
      {hint && (
        <div className="space-y-2 rounded-2xl border border-line p-3 animate-rise">
          <p className="text-xs text-muted">We read only the link text — not the listing. Confirm the address below:</p>
          <AddressSearch initialQuery={hint} autoFocus referenceUrl={url.trim()} />
        </div>
      )}
      <p className="px-2 text-[11.5px] leading-relaxed text-muted">
        BrickIQ never scrapes or downloads Funda content. The link is stored only as your reference; property details come from public registers and your input.{" "}
        <button type="button" onClick={onSwitch} className="font-medium text-emerald-2 underline underline-offset-2">Search by address instead</button>
      </p>
    </div>
  );
}
