"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Calculator, Check, FileText, LayoutDashboard, Scale, Share2, TrendingUp } from "lucide-react";
import type { Property } from "@/lib/types";
import { analyze } from "@/lib/engine/analysis";
import { defaultBidInputs, simulateBid, type BidInputs } from "@/lib/engine/bidding";
import { propertyHref } from "@/lib/property-codec";
import { LogoMark } from "../Brand";
import { cn } from "../ui";
import { OverviewPanel } from "./OverviewPanel";
import { ValuePanel } from "./ValuePanel";
import { CompsPanel } from "./CompsPanel";
import { BidPanel } from "./BidPanel";
import { AnalystPanel } from "./AnalystPanel";
import { ReportPanel } from "./ReportPanel";
import { saveScenario, loadScenario } from "@/lib/scenario-store";

export type TabKey = "overview" | "value" | "comps" | "bid" | "analyst" | "report";

const TABS: { key: TabKey; label: string; short: string; Icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", short: "Overview", Icon: LayoutDashboard },
  { key: "value", label: "Valuation", short: "Value", Icon: TrendingUp },
  { key: "comps", label: "Comparables", short: "Comps", Icon: Scale },
  { key: "bid", label: "Bidding", short: "Bid", Icon: Calculator },
  { key: "analyst", label: "AI Analyst", short: "Analyst", Icon: Bot },
  { key: "report", label: "Report", short: "Report", Icon: FileText },
];

export function Dashboard({ property }: { property: Property }) {
  const [tab, setTabState] = useState<TabKey>("overview");
  const [bid, setBid] = useState<BidInputs>(() => defaultBidInputs(property));
  const [shared, setShared] = useState(false);

  // Restore deep-linked tab & saved scenario
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "") as TabKey;
      if (TABS.some((t) => t.key === h)) setTabState(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    const saved = loadScenario(property.id);
    if (saved) setBid(saved);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [property.id]);

  useEffect(() => {
    saveScenario(property.id, bid);
  }, [property.id, bid]);

  const setTab = useCallback((t: TabKey) => {
    setTabState(t);
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${t}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const analysis = useMemo(() => analyze(property), [property]);
  const outcome = useMemo(() => simulateBid(property, bid), [property, bid]);

  const share = async () => {
    const url = window.location.origin + propertyHref(property);
    try {
      if (navigator.share) {
        await navigator.share({ title: `BrickIQ report · ${property.address.value.display}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* user cancelled share sheet */
    }
  };

  return (
    <div className="min-h-dvh pb-28 lg:pb-16">
      {/* App bar */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="Back to BrickIQ home" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-ivory-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <LogoMark className="hidden h-7 w-7 sm:block" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{property.address.value.display.split(",")[0]}</div>
            <div className="truncate text-[11px] text-muted">
              {property.isDemo ? "Demo report · synthetic data" : `${property.address.value.city} · Intelligence report`}
            </div>
          </div>
          <button
            type="button"
            onClick={share}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-sm font-medium shadow-card hover:bg-white"
          >
            {shared ? <Check className="h-4 w-4 text-emerald-2" /> : <Share2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{shared ? "Link copied" : "Share"}</span>
          </button>
        </div>
        {/* Desktop / tablet tabs */}
        <nav className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 pb-2 no-scrollbar sm:px-6 lg:flex" aria-label="Report sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                tab === t.key ? "bg-ink text-ivory" : "text-ink-2 hover:bg-ivory-2",
              )}
            >
              <t.Icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div key={tab} className="animate-rise">
          {tab === "overview" && <OverviewPanel analysis={analysis} onNavigate={setTab} />}
          {tab === "value" && <ValuePanel analysis={analysis} />}
          {tab === "comps" && <CompsPanel analysis={analysis} />}
          {tab === "bid" && <BidPanel property={property} inputs={bid} onChange={setBid} outcome={outcome} onNavigate={setTab} />}
          {tab === "analyst" && <AnalystPanel analysis={analysis} bid={{ inputs: bid, outcome }} />}
          {tab === "report" && <ReportPanel analysis={analysis} bid={{ inputs: bid, outcome }} />}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 backdrop-blur-xl lg:hidden"
        aria-label="Report sections"
      >
        <div className="mx-auto grid max-w-lg grid-cols-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 pb-2 pt-2.5 text-[10px] font-medium transition",
                tab === t.key ? "text-emerald" : "text-muted",
              )}
            >
              <span className={cn("grid h-7 w-11 place-items-center rounded-full transition", tab === t.key && "bg-mint")}>
                <t.Icon className="h-[18px] w-[18px]" />
              </span>
              {t.short}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
