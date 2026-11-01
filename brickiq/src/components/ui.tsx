import Link from "next/link";
import clsx from "clsx";
import type { Provenance } from "@/lib/types";
import { BadgeCheck, Cpu, FlaskConical, PencilLine } from "lucide-react";

export function cn(...a: Parameters<typeof clsx>) {
  return clsx(...a);
}

type BtnVariant = "primary" | "secondary" | "ghost" | "dark";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none";
const btnVariants: Record<BtnVariant, string> = {
  primary:
    "bg-emerald text-ivory hover:bg-emerald-2 shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_8px_20px_-8px_rgba(13,86,66,0.6)]",
  dark: "bg-ink text-ivory hover:bg-ink-2",
  secondary: "bg-paper text-ink border border-line hover:border-line-2 hover:bg-white shadow-card",
  ghost: "text-ink-2 hover:text-ink hover:bg-ivory-2",
};
const btnSizes = { sm: "h-9 px-4 text-sm", md: "h-11 px-5 text-[15px]", lg: "h-13 px-7 text-base" };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: keyof typeof btnSizes }) {
  return <button className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: { href: string; variant?: BtnVariant; size?: keyof typeof btnSizes; className?: string; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <Link href={href} className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...rest}>
      {children}
    </Link>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-3xl border border-line bg-paper shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-[11px] font-semibold uppercase tracking-[0.14em] text-muted", className)}>{children}</div>
  );
}

const PROV: Record<Provenance, { label: string; cls: string; Icon: typeof BadgeCheck; desc: string }> = {
  verified: {
    label: "Verified",
    cls: "bg-mint text-emerald border-emerald/15",
    Icon: BadgeCheck,
    desc: "From an official public register (PDOK / BAG)",
  },
  user: {
    label: "Your input",
    cls: "bg-slate-soft text-slate border-slate/15",
    Icon: PencilLine,
    desc: "Entered or adjusted by you",
  },
  model: {
    label: "Model estimate",
    cls: "bg-gold-soft text-gold border-gold/20",
    Icon: Cpu,
    desc: "Calculated by BrickIQ's transparent model",
  },
  synthetic: {
    label: "Demo data",
    cls: "bg-violet-soft text-violet border-violet/15",
    Icon: FlaskConical,
    desc: "Synthetic demonstration data — not real",
  },
};

export function ProvenanceTag({
  source,
  origin,
  compact,
  className,
}: {
  source: Provenance;
  origin?: string;
  compact?: boolean;
  className?: string;
}) {
  const p = PROV[source];
  return (
    <span
      title={origin ? `${p.desc} · ${origin}` : p.desc}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold tracking-wide whitespace-nowrap",
        p.cls,
        className,
      )}
    >
      <p.Icon className="h-3 w-3" aria-hidden />
      {!compact && p.label}
      {compact && <span className="sr-only">{p.label}</span>}
    </span>
  );
}

export function ProvenanceLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-2", className)}>
      {(Object.keys(PROV) as Provenance[]).map((k) => (
        <div key={k} className="flex items-center gap-2 text-xs text-ink-2">
          <ProvenanceTag source={k} />
          <span className="hidden sm:inline text-muted">{PROV[k].desc}</span>
        </div>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex rounded-full bg-ivory-2 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap",
            value === o.value ? "bg-paper text-ink shadow-card" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Disclaimer({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <p className={cn("text-[11.5px] leading-relaxed text-muted", className)}>
      {children ??
        "BrickIQ provides indicative, model-based estimates for information only. They are not certified valuations (taxatierapport), financial advice, or predictions of whether an offer will be accepted."}
    </p>
  );
}

export function Pill({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "info"; className?: string }) {
  const tones = {
    neutral: "bg-ivory-2 text-ink-2",
    good: "bg-mint text-emerald",
    warn: "bg-gold-soft text-gold",
    bad: "bg-rose-soft text-rose",
    info: "bg-slate-soft text-slate",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
