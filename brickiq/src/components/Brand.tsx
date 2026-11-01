import Link from "next/link";
import { cn } from "./ui";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0d5642" />
      <path d="M14 46V28l18-12 18 12v18" fill="none" stroke="#f6f2e9" strokeWidth="4" strokeLinejoin="round" />
      <rect x="22" y="32" width="8" height="6" rx="1" fill="#f6f2e9" />
      <rect x="34" y="32" width="8" height="6" rx="1" fill="#f6f2e9" />
      <rect x="22" y="40" width="20" height="6" rx="1" fill="#2e9e78" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="BrickIQ home">
      <LogoMark />
      <span className="font-display text-[22px] font-semibold tracking-tight">
        Brick<span className="text-emerald-2">IQ</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/80 backdrop-blur-xl supports-[backdrop-filter]:bg-ivory/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          {right ?? (
            <>
              <Link href="/#how" className="hidden rounded-full px-3 py-2 text-ink-2 hover:text-ink sm:block">
                How it works
              </Link>
              <Link href="/methodology" className="hidden rounded-full px-3 py-2 text-ink-2 hover:text-ink sm:block">
                Methodology
              </Link>
              <Link href="/#demos" className="rounded-full px-3 py-2 text-ink-2 hover:text-ink">
                Demos
              </Link>
              <Link
                href="/#search"
                className="ml-1 rounded-full bg-ink px-4 py-2 font-medium text-ivory transition hover:bg-ink-2"
              >
                Analyse a home
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ivory-2/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted">Know before you buy. Transparent property intelligence for Dutch homebuyers.</p>
        </div>
        <div className="text-sm">
          <div className="mb-3 font-semibold">Product</div>
          <ul className="space-y-2 text-ink-2">
            <li><Link href="/#search" className="hover:text-ink">Analyse an address</Link></li>
            <li><Link href="/analyze?mode=manual" className="hover:text-ink">Enter details manually</Link></li>
            <li><Link href="/#demos" className="hover:text-ink">Demo reports</Link></li>
            <li><Link href="/methodology" className="hover:text-ink">Methodology & data</Link></li>
          </ul>
        </div>
        <div className="space-y-2 text-xs leading-relaxed text-muted">
          <p>
            Address data: PDOK Locatieserver and Basisregistratie Adressen en Gebouwen (BAG), © Kadaster, CC0. Map tiles: BRT Achtergrondkaart via PDOK.
          </p>
          <p>
            BrickIQ estimates are indicative and not certified valuations. Comparable sales in this build are synthetic demonstration data. Not affiliated with Funda or Kadaster.
          </p>
          <p>© {new Date().getFullYear()} BrickIQ — product demonstration.</p>
        </div>
      </div>
    </footer>
  );
}
