"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, BadgeCheck, Building2, Loader2, MapPin, RotateCcw } from "lucide-react";
import { Button, Card, Eyebrow, ProvenanceTag, cn } from "./ui";
import { AddressSearch } from "./SearchPanel";
import { TileMap } from "./TileMap";
import { buildProperty, propertyHref, type PropertyForm, type VerifiedContext } from "@/lib/property-codec";
import { CITY_OPTIONS, marketReferenceFor } from "@/lib/market";
import {
  CONDITION_LABEL,
  ENERGY_LABELS,
  LEASEHOLD_LABEL,
  OUTDOOR_LABEL,
  PROPERTY_TYPE_LABEL,
  type EnergyLabel,
  type Leasehold,
  type Outdoor,
  type PropertyType,
} from "@/lib/types";

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: VerifiedContext & { bagError?: string } };

export function AnalyzeFlow() {
  const params = useSearchParams();
  const id = params.get("id");
  const ref = params.get("ref") ?? undefined;
  const manual = params.get("mode") === "manual" || !id;
  const [lookup, setLookup] = useState<LookupState>({ status: id ? "loading" : "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLookup({ status: "loading" });
    fetch(`/api/address/lookup?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Lookup failed");
        return d as VerifiedContext & { bagError?: string };
      })
      .then((data) => !cancelled && setLookup({ status: "ok", data }))
      .catch((e: unknown) => !cancelled && setLookup({ status: "error", message: e instanceof Error ? e.message : "Lookup failed" }));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Eyebrow>{manual ? "Manual entry" : "Step 2 of 2 · Complete the details"}</Eyebrow>
      <h1 className="font-display mt-2 text-3xl font-medium sm:text-4xl">
        {manual ? "Describe the property" : "Confirm and complete"}
      </h1>
      <p className="mt-2 max-w-2xl text-ink-2">
        {manual
          ? "Enter what you know. Every value will be marked as your input in the report."
          : "We retrieved the official data below. Add the details only you know — registers don't hold asking prices, condition or energy labels."}
      </p>

      {!manual && (
        <div className="mt-8">
          {lookup.status === "loading" && (
            <Card className="flex items-center gap-3 p-6 text-sm text-ink-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-2" /> Retrieving address and BAG building data from PDOK…
            </Card>
          )}
          {lookup.status === "error" && (
            <Card className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-rose" />
                <div>
                  <div className="font-medium">We couldn&apos;t reach the public address service.</div>
                  <p className="mt-1 text-sm text-muted">{lookup.message}. You can retry, search again or continue with manual entry.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setAttempt((a) => a + 1)}><RotateCcw className="h-4 w-4" /> Retry</Button>
                <Button variant="ghost" onClick={() => (window.location.href = "/analyze?mode=manual")}>Enter manually</Button>
              </div>
              <AddressSearch />
            </Card>
          )}
          {lookup.status === "ok" && <VerifiedPanel data={lookup.data} />}
        </div>
      )}

      {(manual || lookup.status === "ok") && (
        <DetailsForm verified={lookup.status === "ok" ? lookup.data : undefined} referenceUrl={ref} key={lookup.status} />
      )}
    </div>
  );
}

function VerifiedPanel({ data }: { data: VerifiedContext & { bagError?: string } }) {
  const a = data.address;
  const rows: [string, string | undefined][] = [
    ["Street & number", `${a.street} ${a.houseNumber}`],
    ["Postcode", a.postcode],
    ["Place", a.city],
    ["Municipality", a.municipality],
    ["Neighbourhood", a.neighbourhood],
    ["District", a.district],
  ];
  const bag = data.bag;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-mint text-emerald"><MapPin className="h-5 w-5" /></div>
            <div>
              <div className="font-display text-xl font-medium">{a.display}</div>
              <div className="text-xs text-muted">{data.sources.join(" · ")}</div>
            </div>
          </div>
          <ProvenanceTag source="verified" />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 rounded-2xl border border-line bg-ivory/60 p-4">
          <div className="flex items-center gap-2 text-sm font-medium"><Building2 className="h-4 w-4 text-emerald-2" /> BAG building record</div>
          {bag ? (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              {[
                ["Floor area", bag.floorArea ? `${bag.floorArea} m²` : "—"],
                ["Build year", bag.buildYear ? String(bag.buildYear) : "—"],
                ["Usage", bag.usage ?? "—"],
                ["Status", bag.status ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted">
              BAG building attributes could not be retrieved{data.bagError ? ` (${data.bagError})` : ""}. Enter floor area and build year below — they&apos;ll be marked as your input.
            </p>
          )}
          {bag?.verblijfsobjectId && <div className="num mt-3 text-[10.5px] text-muted">Verblijfsobject {bag.verblijfsobjectId}</div>}
        </div>
      </Card>
      {data.coordinates ? (
        <TileMap lat={data.coordinates.lat} lon={data.coordinates.lon} label={a.display.split(",")[0]} className="h-72 lg:h-auto" />
      ) : (
        <Card className="grid place-items-center p-6 text-sm text-muted">No coordinates available</Card>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  prefix,
  min,
  max,
  step,
  verified,
  required,
  hint,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
  verified?: boolean;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 text-sm font-medium">
        {label}
        {verified && <ProvenanceTag source="verified" />}
      </span>
      <span className="mt-1.5 flex h-12 items-center rounded-2xl border border-line bg-paper px-3.5 focus-within:border-emerald-2 focus-within:ring-2 focus-within:ring-emerald-2/15">
        {prefix && <span className="mr-1.5 text-muted">{prefix}</span>}
        <input
          type="number"
          inputMode="numeric"
          className="num h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          required={required}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
        {suffix && <span className="ml-1.5 text-sm text-muted">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-[11.5px] text-muted">{hint}</span>}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1.5 h-12 w-full appearance-none rounded-2xl border border-line bg-paper bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23857e70%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[right_14px_center] bg-no-repeat px-3.5 pr-9 text-[16px] outline-none focus:border-emerald-2 focus:ring-2 focus:ring-emerald-2/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-paper px-3.5 text-[16px] outline-none focus:border-emerald-2 focus:ring-2 focus:ring-emerald-2/15"
      />
    </label>
  );
}

function DetailsForm({ verified, referenceUrl }: { verified?: VerifiedContext; referenceUrl?: string }) {
  const router = useRouter();
  const [f, setF] = useState<Partial<PropertyForm>>(() => ({
    street: "",
    houseNumber: "",
    postcode: "",
    city: "Amsterdam",
    type: "apartment",
    livingArea: verified?.bag?.floorArea,
    buildYear: verified?.bag?.buildYear,
    energyLabel: "C",
    rooms: 3,
    bedrooms: 2,
    condition: 3,
    outdoor: "balcony",
    parking: false,
    leasehold: "freehold",
    askingPrice: undefined,
    referenceUrl,
  }));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof PropertyForm>(k: K, v: PropertyForm[K] | undefined) => setF((s) => ({ ...s, [k]: v }));

  const cityForRef = verified ? verified.address.municipality ?? verified.address.city : f.city;
  const ref = useMemo(() => marketReferenceFor(cityForRef, cityForRef), [cityForRef]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!verified && (!f.street?.trim() || !f.houseNumber?.trim() || !f.city?.trim())) missing.push("address");
    if (!f.livingArea || f.livingArea < 15 || f.livingArea > 2000) missing.push("living area (15–2000 m²)");
    if (!f.buildYear || f.buildYear < 1600 || f.buildYear > new Date().getFullYear() + 3) missing.push("build year");
    if (!f.askingPrice || f.askingPrice < 25000 || f.askingPrice > 25_000_000) missing.push("asking price");
    if (missing.length) {
      setError(`Please check: ${missing.join(", ")}.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    const property = buildProperty(f as PropertyForm, verified);
    router.push(propertyHref(property));
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-6" noValidate>
      {!verified && (
        <Card className="p-5 sm:p-6">
          <div className="mb-4 font-medium">Address</div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <TextField label="Street" value={f.street ?? ""} onChange={(v) => set("street", v)} required placeholder="Prinsengracht" />
            <TextField label="House number" value={f.houseNumber ?? ""} onChange={(v) => set("houseNumber", v)} required placeholder="263-1" />
            <TextField label="Postcode" value={f.postcode ?? ""} onChange={(v) => set("postcode", v)} placeholder="1016 GV" />
            <SelectField label="City (sets the regional prior)" value={f.city ?? "Amsterdam"} onChange={(v) => set("city", v)} options={[...CITY_OPTIONS.map((c) => ({ value: c, label: c })), { value: "Other", label: "Other (national default)" }]} />
          </div>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <div className="mb-4 font-medium">The home</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField label="Property type" value={f.type ?? "apartment"} onChange={(v) => set("type", v)} options={(Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[]).map((k) => ({ value: k, label: PROPERTY_TYPE_LABEL[k] }))} />
          <NumberField label="Living area" suffix="m²" value={f.livingArea} onChange={(v) => set("livingArea", v)} min={15} required verified={verified?.bag?.floorArea !== undefined && verified.bag.floorArea === f.livingArea} hint={verified?.bag?.floorArea ? `BAG: ${verified.bag.floorArea} m²` : undefined} />
          <NumberField label="Build year" value={f.buildYear} onChange={(v) => set("buildYear", v)} min={1600} required verified={verified?.bag?.buildYear !== undefined && verified.bag.buildYear === f.buildYear} hint={verified?.bag?.buildYear ? `BAG: ${verified.bag.buildYear}` : undefined} />
          <SelectField label="Energy label" value={f.energyLabel ?? "C"} onChange={(v) => set("energyLabel", v as EnergyLabel)} options={ENERGY_LABELS.map((l) => ({ value: l, label: l }))} />
          <NumberField label="Rooms" value={f.rooms} onChange={(v) => set("rooms", v)} min={1} />
          <NumberField label="Bedrooms" value={f.bedrooms} onChange={(v) => set("bedrooms", v)} min={0} />
          {f.type !== "apartment" && <NumberField label="Plot area" suffix="m²" value={f.plotArea} onChange={(v) => set("plotArea", v)} min={0} />}
          <SelectField label="Outdoor space" value={f.outdoor ?? "none"} onChange={(v) => set("outdoor", v as Outdoor)} options={(Object.keys(OUTDOOR_LABEL) as Outdoor[]).map((k) => ({ value: k, label: OUTDOOR_LABEL[k] }))} />
          <SelectField label="Private parking" value={f.parking ? "yes" : "no"} onChange={(v) => set("parking", v === "yes")} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Condition</span>
            <span className="text-ink-2">{CONDITION_LABEL[f.condition ?? 3]}</span>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Condition">
            {[1, 2, 3, 4, 5].map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={f.condition === c}
                onClick={() => set("condition", c)}
                className={cn(
                  "h-11 rounded-xl border text-sm font-semibold transition",
                  f.condition === c ? "border-emerald bg-emerald text-ivory" : "border-line bg-paper text-ink-2 hover:border-line-2",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 font-medium">Price & ownership</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Asking price" prefix="€" value={f.askingPrice} onChange={(v) => set("askingPrice", v)} min={25000} step={1000} required />
          <SelectField label="Land tenure" value={f.leasehold ?? "freehold"} onChange={(v) => set("leasehold", v as Leasehold)} options={(Object.keys(LEASEHOLD_LABEL) as Leasehold[]).map((k) => ({ value: k, label: LEASEHOLD_LABEL[k] }))} />
          {f.leasehold === "ongoing" && <NumberField label="Ground lease canon" prefix="€" suffix="/yr" value={f.leaseholdAnnual} onChange={(v) => set("leaseholdAnnual", v)} min={0} />}
          {f.type === "apartment" && <NumberField label="VvE contribution" prefix="€" suffix="/mo" value={f.vveMonthly} onChange={(v) => set("vveMonthly", v)} min={0} />}
          <NumberField
            label="Regional prior"
            prefix="€"
            suffix="/m²"
            value={f.marketReference ?? ref.pricePerSqm}
            onChange={(v) => set("marketReference", v)}
            min={1000}
            step={50}
            hint={`Model assumption · ${ref.label}. Adjust if you know the local market better.`}
          />
        </div>
        {referenceUrl && (
          <p className="mt-4 truncate text-xs text-muted">Reference link saved (not fetched): {referenceUrl}</p>
        )}
      </Card>

      {error && <p role="alert" className="rounded-2xl bg-rose-soft px-4 py-3 text-sm text-rose">{error}</p>}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted"><BadgeCheck className="h-3.5 w-3.5 text-emerald-2" /> Nothing is stored on our servers — your report lives in its link.</p>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Generate intelligence report <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
